/**
 * POST /api/submit — the only way rows reach Supabase.
 *
 * This app shares a Supabase project with the Peshagi landing page but not its
 * deployment, so it carries its own copy of this handler and writes to its own
 * pair of tables (pervyukt_signups / pervyukt_contacts — see
 * supabase/pervyukt-tables.sql). Posting cross-origin to the other site's
 * endpoint would have meant CORS plus a hard dependency on someone else's
 * deploy; two routes against one database is the cheaper arrangement.
 *
 * The browser never holds a Supabase credential. Inserts go out with the
 * service_role key, which bypasses RLS — which is why the tables are created
 * with RLS on and no anon policies. That combination is what keeps
 * https://<project>.supabase.co/rest/v1/pervyukt_contacts from being a public
 * write endpoint; the checks below are only there to filter bot noise before
 * it reaches the table.
 *
 * A successful insert also sends a notification email through Resend. Read the
 * notify() comment before touching any of it: the row is the record of truth
 * and the email is a courtesy on top, so nothing on the mail path may fail a
 * submission or delay the response.
 *
 * Required env vars (Vercel → Settings → Environment Variables):
 *   SUPABASE_URL               https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  service_role key — server-only, never ship to the client
 *
 * Optional:
 *   TURNSTILE_SECRET_KEY  when set, a valid Cloudflare Turnstile token is required
 *   ALLOWED_ORIGINS       comma-separated hosts; defaults to same-origin only
 *   RESEND_API_KEY        Resend → API Keys, "Sending access" is enough. Unset,
 *                         notifications are skipped and submissions still save.
 *   NOTIFY_FROM           sender, e.g. "Pervyukt <notifications@send.pervyukt.com>".
 *                         Must be on a domain verified in Resend. NEVER the
 *                         visitor's address — see the note inside notify().
 *   NOTIFY_TO             comma-separated recipients. While NOTIFY_FROM is still
 *                         Resend's shared onboarding@resend.dev sender this MUST
 *                         be the Resend account owner's own address; that sender
 *                         is refused (403) for anyone else.
 *
 * This route declares no `runtime`, so it stays on the App Router default
 * Node.js runtime. Keep it there — `after()` below and the Node globals this
 * file uses depend on it, and 'edge' is deprecated in the route segment config.
 */

import { after } from "next/server";

const SIGNUPS_TABLE = "pervyukt_signups";
const CONTACTS_TABLE = "pervyukt_contacts";

const MIN_FILL_MS = 3000;         // humans take longer than this to fill a form
const MAX_FORM_AGE_MS = 6 * 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;        // submissions per IP per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

// Hard ceilings on every outbound call. fetch() has no useful default timeout —
// a server that accepts the TCP connection and then never sends headers leaves
// an unbounded fetch pending forever — and Vercel's default maxDuration is now
// 300s. Unbounded, one hung upstream burns five minutes of billed memory and
// hands the visitor a 504 for a submission that may already be saved. These
// three numbers plus maxDuration below are what make that impossible.
const TURNSTILE_TIMEOUT_MS = 5000;
const SUPABASE_TIMEOUT_MS = 8000;
const NOTIFY_TIMEOUT_MS = 3500;

const RESEND_ENDPOINT = "https://api.resend.com/emails";

// Comfortably above 5s (Turnstile) + 8s (Supabase) worst case, and above the
// 3.5s the after() send can add on top of that, while being nowhere near the
// 300s default that would let a hang run up a bill.
export const maxDuration = 20;

// Must stay in step with the <select> in app/interactive.tsx. Anything not on
// this list is stored as the fallback rather than as sent — a free-text
// purpose column is how the Peshagi site learned its inserts were arriving
// from curl rather than a browser.
const PURPOSES = [
  "Partnership or investment",
  "Distribution or manufacturing",
  "Research collaboration",
  "Press",
  "Careers",
  "General enquiry",
];
const DEFAULT_PURPOSE = "General enquiry";

// Per-instance only — a warm lambda catches bursts, a cold one starts fresh.
// A speed bump, not the security boundary; that's the absent anon policy plus
// the service-role key never leaving the server.
const hits = new Map<string, number[]>();

/**
 * Returns "" when the client can't be identified, in which case the caller
 * must SKIP the rate limit rather than bucket everyone together — a shared
 * fallback key puts every unidentified visitor in one bucket and starts
 * returning 429 to real people.
 */
function clientIp(req: Request) {
  const first = (v: string | null) => (v ?? "").split(",")[0].trim();
  return (
    first(req.headers.get("x-forwarded-for")) ||
    first(req.headers.get("x-real-ip")) ||
    first(req.headers.get("x-vercel-forwarded-for")) ||
    ""
  );
}

function rateLimited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > RATE_LIMIT_MAX;
}

/**
 * Drive-by bots either omit Origin or send someone else's. A determined
 * attacker can forge the header, so this filters noise rather than securing
 * the endpoint.
 */
function originAllowed(req: Request) {
  const origin = req.headers.get("origin");
  if (!origin) return false;

  const allowList = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  let host: string;
  try {
    host = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }

  if (allowList.length) return allowList.includes(host);
  return host === (req.headers.get("host") ?? "").toLowerCase();
}

async function turnstileOk(token: unknown, ip: string) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return true; // not configured yet — skip the check

  const body = new URLSearchParams({ secret, response: typeof token === "string" ? token : "" });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(TURNSTILE_TIMEOUT_MS),
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

/**
 * PostgREST forwards PostgreSQL's error structure verbatim as JSON and puts the
 * SQLSTATE in a dedicated field:
 *
 *   {"code":"23505",
 *    "details":"Key (email)=(a@b.com) already exists.",
 *    "hint":null,
 *    "message":"duplicate key value violates unique constraint \"pervyukt_signups_email_key\""}
 *
 * Read the code from there rather than grepping the raw body. A failure that
 * never reached PostgREST at all (a gateway 502, an HTML error page) is not
 * JSON, so a parse failure has to read as "no code" instead of throwing over
 * the top of the real error we are trying to report.
 */
function errorCode(body: string) {
  try {
    const parsed = JSON.parse(body) as { code?: unknown };
    return typeof parsed?.code === "string" ? parsed.code : "";
  } catch {
    return "";
  }
}

/**
 * Inserts one row and reports whether a row was ACTUALLY created.
 *
 *   true  — Postgres wrote a new row.
 *   false — the row already existed and we chose to report that as success.
 *
 * The return value is new, and it exists for one reason: to decide whether
 * there is anything to email about. Without it every returning subscriber who
 * re-submits the hero form generates a "new signup!" for a row that was never
 * created.
 *
 * PostgREST does NOT quietly absorb a unique violation — it returns a genuine
 * 409 and this function is what swallows it. So the created/duplicate answer
 * was always sitting on the line that discarded it, and `Prefer: return=minimal`
 * needs no change: with no body to parse, "did a row appear?" is exactly "did
 * this not fail?".
 */
async function insert(
  table: string,
  row: Record<string, string>,
  ignoreDuplicate = false,
): Promise<boolean> {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
  const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/${table}`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
    cache: "no-store",
  });

  if (res.ok) return true;

  const detail = await res.text();
  // 23505 = unique violation, i.e. this email is already on the list. Report
  // that as success: telling a returning visitor their address is taken is
  // both useless to them and a membership oracle for anyone else.
  //
  // This used to be `detail.includes("23505")`, which matched those digits
  // anywhere in the raw body and ignored the status entirely. PostgreSQL echoes
  // the offending row back inside `details` ("Failing row contains (...)"), so
  // an unrelated failure on an address like 23505@example.com matched too — and
  // was then discarded as a duplicate: no row, nothing thrown, nothing logged.
  // Match the status AND the structured code.
  if (ignoreDuplicate && res.status === 409 && errorCode(detail) === "23505") return false;
  throw new Error(`supabase ${res.status}: ${detail}`);
}

/* -------------------------------------------------------------- notification */

/**
 * Escapes the five characters that can break out of HTML text or an attribute
 * value. Every user-supplied byte that reaches the email body goes through
 * this, & first so entities are not double-escaped.
 *
 * The notification is the one place where the site's operator reads
 * attacker-controlled text with their guard down — in a webmail preview pane,
 * and in the Resend dashboard's own HTML view, which is a browser page they are
 * logged into. Unescaped, a `message` of `<img src=x onerror=...>` is live
 * markup there, not a string.
 */
function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Escape FIRST, then turn newlines into <br> — never the other way round. */
function escapeMultiline(value: unknown): string {
  return escapeHtml(value).replace(/\r\n|\r|\n/g, "<br>");
}

/**
 * Strips CR/LF/tabs and collapses runs of whitespace, for the subject line.
 *
 * To be clear about why: this is NOT classic SMTP header injection defence.
 * Resend's send endpoint is a JSON REST API — a newline travels as the two
 * characters \n inside a JSON document, Resend parses it server-side and builds
 * the MIME message itself, and `to`/`from` are separate typed fields, so a
 * newline in `subject` cannot terminate a header or fabricate a Bcc: line the
 * way it can with raw SMTP. This is purely so a subject with newlines in it
 * doesn't render as garbage and hide text from whoever reads it. The real
 * injection surface here is the HTML body, handled above.
 */
function headerSafe(value: unknown, max = 200): string {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, max);
}

/**
 * An href is an attribute context, so the address is whitelisted before it is
 * ever concatenated into one. This pattern admits no quote, angle bracket,
 * space, colon or backslash — everything you would need to escape the attribute
 * or smuggle in a javascript: scheme. Anything that fails it renders as escaped
 * plain text instead of a link, which is a fine outcome.
 */
const MAILTO_SAFE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const mailtoLink = (email: string) =>
  MAILTO_SAFE.test(email)
    ? `<a href="mailto:${escapeHtml(email)}" style="color:#0f766e;text-decoration:none">${escapeHtml(email)}</a>`
    : escapeHtml(email);

const WRAP = (title: string, rows: string) => `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f5f5f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#231F20">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e7e5e4;border-radius:10px">
    <tr><td style="padding:20px 24px;border-bottom:1px solid #f0efee">
      <div style="font-size:11px;letter-spacing:.09em;text-transform:uppercase;color:#939598">Pervyukt</div>
      <div style="font-size:17px;font-weight:600;margin-top:4px">${title}</div>
    </td></tr>
    <tr><td style="padding:8px 24px 20px">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-size:14px;line-height:1.55">${rows}</table>
    </td></tr>
    <tr><td style="padding:14px 24px;border-top:1px solid #f0efee;font-size:12px;color:#939598">Reply to this message to answer them directly.</td></tr>
  </table>
</body></html>`;

const ROW = (label: string, valueHtml: string) => `<tr>
  <td style="padding:7px 0;width:110px;vertical-align:top;color:#939598;font-size:12px;text-transform:uppercase;letter-spacing:.05em">${escapeHtml(label)}</td>
  <td style="padding:7px 0;vertical-align:top;word-break:break-word">${valueHtml}</td>
</tr>`;

type SignupRow = { email: string };
type ContactRow = {
  name: string;
  email: string;
  mobile: string;
  purpose: string;
  message: string;
};
type Pending =
  | { kind: "signup"; row: SignupRow; loadedAt: number }
  | { kind: "contact"; row: ContactRow; loadedAt: number };

/**
 * Builds the Resend payload for one submission. Every dynamic value in the html
 * has been through escapeHtml/escapeMultiline/mailtoLink; the text part is the
 * same data with no escaping, which is correct because it is never parsed as
 * markup.
 */
function buildEmail(pending: Pending) {
  if (pending.kind === "signup") {
    const row = pending.row;
    return {
      subject: headerSafe(`Pervyukt signup — ${row.email}`, 200),
      html: WRAP("New waitlist signup", ROW("Email", mailtoLink(row.email))),
      text: `New waitlist signup\n\nEmail: ${row.email}\n`,
    };
  }

  const row = pending.row;
  const rows = [
    ROW("Name", escapeHtml(row.name)),
    ROW("Email", mailtoLink(row.email)),
    row.mobile ? ROW("Mobile", escapeHtml(row.mobile)) : "",
    ROW("Purpose", escapeHtml(row.purpose)),
    row.message ? ROW("Message", escapeMultiline(row.message)) : "",
  ].join("");

  return {
    subject: headerSafe(`Pervyukt enquiry (${row.purpose}) — ${row.name}`, 200),
    html: WRAP("New contact enquiry", rows),
    text:
      "New contact enquiry\n\n" +
      `Name:    ${row.name}\n` +
      `Email:   ${row.email}\n` +
      `Mobile:  ${row.mobile || "-"}\n` +
      `Purpose: ${row.purpose}\n\n` +
      `${row.message || "(no message)"}\n`,
  };
}

/**
 * Tells us a row landed. NEVER THROWS and never rejects — every exit path
 * returns. That is the contract the caller depends on: by the time this runs
 * the row is already committed in Supabase, so nothing in here is allowed to
 * become the visitor's error.
 *
 * It is scheduled with after() from next/server rather than awaited inline, so
 * the visitor gets their 200 without paying for the Resend round trip. after()
 * is stable since Next 15.1 (this app is on 16.2.6), needs no extra dependency,
 * and on Vercel is implemented on the same waitUntil primitive that keeps the
 * instance alive until the promise settles — which is exactly what a bare
 * dangling promise does NOT get: once a function sends its response, unregistered
 * background work pauses and only resumes on the next invocation, so a
 * fire-and-forget send stops partway through the TLS exchange.
 *
 * Two consequences worth remembering. after() work shares the route's
 * maxDuration, so it buys ordering, not extra time budget — hence the timeout
 * below. And an unhandled rejection inside an after() callback has no request
 * left to fail, so it surfaces as a process-level unhandledRejection, which
 * fluid compute logs before draining an instance that is serving other people's
 * submissions. Hence "never throws", plus a .catch() at the call site.
 *
 * The sibling Peshagi handler awaits the same call inline instead: it is a plain
 * Vercel Node function in a project with no package.json, so neither after() nor
 * waitUntil() is reachable there without giving that static site its first build
 * step. That divergence is deliberate.
 */
async function notify(pending: Pending): Promise<void> {
  const started = Date.now();
  const source = `pervyukt:${pending.kind}`;

  try {
    const key = process.env.RESEND_API_KEY;
    const from = process.env.NOTIFY_FROM;
    const to = (process.env.NOTIFY_TO ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    // Not configured is a warning, not an error: the submission still worked.
    // Log which piece is missing — never the key itself.
    if (!key || !from || to.length === 0) {
      console.warn(
        `[notify] skipped source=${source} reason=not_configured` +
          ` key=${key ? "set" : "missing"} from=${from ? "set" : "missing"} to=${to.length}`,
      );
      return;
    }

    const mail = buildEmail(pending);

    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // Documented as required: "All API requests must include a User-Agent
        // header. Requests without this header will be rejected with a 403
        // status code" — blocked at the edge with error code 1010, BEFORE the
        // API sees them, so the body is not the usual JSON error shape and the
        // message says nothing about the real cause. Node's global fetch
        // happens to send "User-Agent: node", which is why a hand-rolled
        // integration often works by accident; that default is not contractual
        // across runtimes, so set it explicitly and stop thinking about it.
        "User-Agent": "pervyukt-landing/1.0",
        // Scoped to the page load, so a double-submit or a browser retry of the
        // same form collapses into one email (Resend remembers a key for 24h).
        // Trade-off, stated plainly: two genuinely different enquiries sent from
        // one page load without a reload also collapse to one email. Both rows
        // are still in pervyukt_contacts, which is the record of truth.
        "Idempotency-Key": `${source}/${pending.row.email}/${pending.loadedAt}`.slice(0, 256),
      },
      body: JSON.stringify({
        from,
        to,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        // snake_case. `replyTo` is a Node-SDK-only alias; send that over raw
        // HTTP and Resend drops it as an unknown field with no error, and you
        // only find out when you hit Reply and it goes to your own from address.
        //
        // And note WHICH field the visitor's address goes in. Putting it in
        // `from` would mean sending mail claiming to be gmail.com over Resend's
        // infrastructure: SPF and DKIM align to our domain, not theirs, DMARC
        // fails, Gmail junks it — and it is spoofing. reply_to gives the exact
        // behaviour actually wanted: hit Reply, it reaches the visitor.
        reply_to: pending.row.email,
      }),
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
      cache: "no-store",
    });

    const ms = Date.now() - started;

    if (!res.ok) {
      // Log the error NAME, not just the status. A bare 403 is ambiguous:
      // unverified from-domain, a resend.dev sender aimed at anyone but the
      // account owner, a revoked key, or the missing User-Agent above. Truncate
      // the body — Vercel caps a log line at 256KB and a proxy in front of
      // Resend can return a whole HTML page.
      const detail = (await res.text().catch(() => "")).slice(0, 500);
      console.error(
        `[notify] failed source=${source} status=${res.status} ms=${ms}` +
          ` daily=${res.headers.get("x-resend-daily-quota") ?? "-"}` +
          ` monthly=${res.headers.get("x-resend-monthly-quota") ?? "-"}` +
          ` retry-after=${res.headers.get("retry-after") ?? "-"} detail=${JSON.stringify(detail)}`,
      );
      return;
    }

    // The Resend message id is the only handle tying a row in Supabase to a
    // delivery record in the Resend dashboard, and Vercel's Hobby runtime logs
    // are gone in an hour.
    const body = (await res.json().catch(() => ({}))) as { id?: string };
    console.log(`[notify] sent source=${source} id=${body.id ?? "unknown"} ms=${ms}`);
  } catch (err) {
    // AbortSignal.timeout rejects with name 'TimeoutError' — NOT 'AbortError'.
    // And on a DNS/TCP failure fetch rejects with a bare "TypeError: fetch
    // failed"; the actual reason (ENOTFOUND, ECONNRESET) is only on err.cause.
    const e = err as { name?: string; message?: string; cause?: { code?: string; message?: string } };
    const reason = e?.name === "TimeoutError" ? "timeout" : "network_error";
    console.error(
      `[notify] failed source=${source} reason=${reason} ms=${Date.now() - started}` +
        ` name=${e?.name} message=${e?.message} cause=${e?.cause?.code ?? e?.cause?.message ?? "none"}`,
    );
  }
}

/* ---------------------------------------------------------------- validation */

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status });

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/**
 * Optional, so blank is fine — but it should look like a phone number when
 * present. Returns null for "present but not a phone number", which the
 * caller rejects; a free-text column otherwise happily stores whatever a
 * script felt like sending.
 */
function phone(v: unknown) {
  const raw = str(v, 24);
  if (!raw) return "";
  if (!/^[+\d(][\d\s()\-.]*$/.test(raw)) return null;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15 ? raw : null;
}

export async function POST(req: Request) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error("SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are not set");
    return json(500, { error: "Server not configured" });
  }

  if (!originAllowed(req)) return json(403, { error: "Forbidden" });

  // No identifiable IP → no rate limiting. The honeypot, timing and origin
  // checks are what actually filter bots; a shared bucket would only deny
  // service to real people.
  const ip = clientIp(req);
  if (ip && rateLimited(ip)) return json(429, { error: "Too many submissions" });

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: "Bad request" });
  }
  if (!body || typeof body !== "object") return json(400, { error: "Bad request" });

  // Honeypot: hidden field, invisible to humans, irresistible to form fillers.
  // Answer 200 so the bot records a success and doesn't come back to retry.
  if (str(body.website, 200)) return json(200, { ok: true });

  // Timing: `t` is stamped when the page loads. Instant posts are scripted;
  // stale ones are replayed captures.
  const loadedAt = Number(body.t ?? 0);
  const elapsed = Date.now() - loadedAt;
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS || elapsed > MAX_FORM_AGE_MS) {
    return json(400, { error: "Please try again" });
  }

  if (!(await turnstileOk(body.token, ip))) {
    return json(403, { error: "Verification failed" });
  }

  const email = str(body.email, 200).toLowerCase();
  if (!isEmail(email)) return json(400, { error: "Invalid email" });

  // Set inside the try, used outside it. `pending` stays null unless a row was
  // genuinely written, which is what keeps a swallowed duplicate silent.
  let pending: Pending | null = null;

  try {
    if (body.form === "signup") {
      // pervyukt_signups.email is UNIQUE and repeat signups are routine, so a
      // duplicate is expected here and must not read as an error to the visitor.
      const created = await insert(SIGNUPS_TABLE, { email }, true);
      if (created) pending = { kind: "signup", row: { email }, loadedAt };
    } else if (body.form === "contact") {
      const name = str(body.name, 100);
      if (!name) return json(400, { error: "Name is required" });

      const mobile = phone(body.mobile);
      if (mobile === null) return json(400, { error: "Invalid phone number" });

      const purpose = str(body.purpose, 50);
      const row: ContactRow = {
        name,
        email,
        mobile,
        purpose: PURPOSES.includes(purpose) ? purpose : DEFAULT_PURPOSE,
        message: str(body.message, 200),
      };
      // pervyukt_contacts has no unique constraint, so there is no duplicate to
      // ignore and this is always true. Leaving ignoreDuplicate at its default
      // keeps it that way: a 23505 here would mean someone added a constraint
      // without revisiting this code, and should still throw rather than vanish.
      await insert(CONTACTS_TABLE, row);
      pending = { kind: "contact", row, loadedAt };
    } else {
      return json(400, { error: "Unknown form" });
    }
  } catch (err) {
    // Reached only when the INSERT failed. No row exists, so a 500 is honest.
    console.error(err);
    return json(500, { error: "Something went wrong" });
  }

  // ------------------------------------------------------------------------
  // The row is committed. This is the failure-isolation boundary: the send is
  // scheduled OUTSIDE the catch that produces the 500, so an email problem is
  // structurally incapable of being reported as a database problem, and after()
  // cannot change a response that has already been decided. notify() is total by
  // construction; the .catch() is insurance against a future edit introducing a
  // throw, which here would become a process-level unhandled rejection.
  // ------------------------------------------------------------------------
  if (pending) {
    const payload = pending;
    after(() => notify(payload).catch(() => {}));
  }

  return json(200, { ok: true });
}
