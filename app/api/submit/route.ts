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
 * Required env vars (Vercel → Settings → Environment Variables):
 *   SUPABASE_URL               https://<project>.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  service_role key — server-only, never ship to the client
 *
 * Optional:
 *   TURNSTILE_SECRET_KEY  when set, a valid Cloudflare Turnstile token is required
 *   ALLOWED_ORIGINS       comma-separated hosts; defaults to same-origin only
 */

const SIGNUPS_TABLE = "pervyukt_signups";
const CONTACTS_TABLE = "pervyukt_contacts";

const MIN_FILL_MS = 3000;         // humans take longer than this to fill a form
const MAX_FORM_AGE_MS = 6 * 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;        // submissions per IP per window
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

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
    });
    const json = (await res.json()) as { success?: boolean };
    return json.success === true;
  } catch {
    return false;
  }
}

async function insert(table: string, row: Record<string, string>, ignoreDuplicate = false) {
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
  });

  if (res.ok) return;

  const detail = await res.text();
  // 23505 = unique violation, i.e. this email is already on the list. Report
  // that as success: telling a returning visitor their address is taken is
  // both useless to them and a membership oracle for anyone else.
  if (ignoreDuplicate && detail.includes("23505")) return;
  throw new Error(`supabase ${res.status}: ${detail}`);
}

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
  const elapsed = Date.now() - Number(body.t ?? 0);
  if (!Number.isFinite(elapsed) || elapsed < MIN_FILL_MS || elapsed > MAX_FORM_AGE_MS) {
    return json(400, { error: "Please try again" });
  }

  if (!(await turnstileOk(body.token, ip))) {
    return json(403, { error: "Verification failed" });
  }

  const email = str(body.email, 200).toLowerCase();
  if (!isEmail(email)) return json(400, { error: "Invalid email" });

  try {
    if (body.form === "signup") {
      await insert(SIGNUPS_TABLE, { email }, true);
    } else if (body.form === "contact") {
      const name = str(body.name, 100);
      if (!name) return json(400, { error: "Name is required" });

      const mobile = phone(body.mobile);
      if (mobile === null) return json(400, { error: "Invalid phone number" });

      const purpose = str(body.purpose, 50);
      await insert(CONTACTS_TABLE, {
        name,
        email,
        mobile,
        purpose: PURPOSES.includes(purpose) ? purpose : DEFAULT_PURPOSE,
        message: str(body.message, 200),
      });
    } else {
      return json(400, { error: "Unknown form" });
    }
  } catch (err) {
    console.error(err);
    return json(500, { error: "Something went wrong" });
  }

  return json(200, { ok: true });
}
