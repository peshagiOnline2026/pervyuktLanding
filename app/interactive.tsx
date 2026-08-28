"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

// The contact form posts to /api/submit, which is the only thing holding a
// Supabase credential. See app/api/submit/route.ts.
const ENQUIRY_NOTE = "Thanks for reaching out — we’ll be in touch.";
const FALLBACK_ERROR = "Something went wrong — please try again.";

// Stamped when this bundle loads in the browser. The route handler rejects
// posts that arrive implausibly fast (scripted) or implausibly late (a
// replayed capture), so it needs to know when the visitor met the form.
const PAGE_LOADED_AT = Date.now();

type Status = { text: string; failed: boolean };

/** Trimmed string reader over a form's current values. */
function reader(form: HTMLFormElement) {
  const data = new FormData(form);
  return (name: string) => String(data.get(name) ?? "").trim();
}

/**
 * Submit plumbing for the enquiry form: disable while in flight, post, then
 * report. Failures surface the server's own message rather than a generic
 * one, so "Invalid phone number" reaches the person who can fix it.
 */
function useSubmit(
  build: (get: (name: string) => string) => Record<string, unknown>,
  successNote: string,
  onDone?: () => void,
) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Captured before the first await: React clears currentTarget once the
    // handler yields, and the reset below still needs the element.
    const form = event.currentTarget;
    setStatus(null);
    setBusy(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...build(reader(form)), t: PAGE_LOADED_AT }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(body.error || FALLBACK_ERROR);
      setStatus({ text: successNote, failed: false });
      form.reset();
      onDone?.();
    } catch (err) {
      setStatus({ text: err instanceof Error ? err.message : FALLBACK_ERROR, failed: true });
    } finally {
      setBusy(false);
    }
  }

  const statusClass = `form-status${status ? (status.failed ? " is-error" : " is-note") : ""}`;
  return { status, busy, onSubmit, statusClass };
}

/**
 * Transparent over the hero, solid white once past it.
 *
 * Two things ride on `is-scrolled`. The CTA only appears with the steady bar —
 * over the film there is deliberately nothing to click, so the hero stays a
 * single image. And the logo carries a pale plate until then: the retail
 * mark's forest quadrant is the hero's own green, so a quarter of it vanishes
 * against the film exactly as the emblem does on the mission plate. Once the
 * bar itself is white the plate has nothing left to do and fades out.
 */
export function SiteHeader() {
  const ref = useRef<HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const header = ref.current;
    const hero = document.querySelector(".hero");
    if (!header || !hero) return;
    // Solid a little before the hero's bottom edge reaches the header, not at
    // it: the hero's scroll cue sits at its bottom-left, which is the logo's
    // corner, and it would otherwise slide under a still-transparent bar and
    // collide with the mark. Going white early covers it instead.
    const onScroll = () =>
      setScrolled(hero.getBoundingClientRect().bottom <= header.offsetHeight + 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <header ref={ref} className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="site-header__inner container">
        <a className="logo" href="#top" aria-label="PARVYUKT home">
          <Image src="/pervyukt-retail-mark.png" alt="PARVYUKT" width={1089} height={662} priority />
        </a>
        {/* Hidden rather than unmounted, so the arrival is a transition and not
            a reflow of the bar. visibility:hidden also keeps it out of the tab
            order while it is invisible. */}
        <a className="site-header__cta" href="#contact">Partner with us</a>
      </div>
    </header>
  );
}

/**
 * Hero backdrop: the brand film, autoplaying muted on a loop with the logo
 * end-card as its poster. Mute and pause mirror the element's real state via
 * its own events, so the controls are correct from first paint.
 */
export function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    v.muted = true;                      // React can drop this attribute on hydration
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      v.pause();                         // leave the poster showing
      return;
    }
    v.play().catch(() => { /* autoplay refused; the poster stands in */ });
  }, []);

  return (
    <>
      <video
        ref={ref}
        className="hero__bg"
        poster="/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}
        onPlay={() => setPaused(false)}
        onPause={() => setPaused(true)}
      >
        <source src="/hero-film.mp4" type="video/mp4" />
      </video>

      <div className="hero__controls">
        <button
          type="button"
          className={`icon-btn${muted ? " is-off" : ""}`}
          aria-label={muted ? "Unmute film" : "Mute film"}
          onClick={() => { const v = ref.current; if (v) v.muted = !v.muted; }}
        >
          {muted ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path className="solid" d="M4 9h3l4-4v14l-4-4H4z" /><path d="M16 9l5 6M21 9l-5 6" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path className="solid" d="M4 9h3l4-4v14l-4-4H4z" /><path d="M16 8a5 5 0 0 1 0 8M18.5 5.5a8.5 8.5 0 0 1 0 13" /></svg>
          )}
        </button>
        <button
          type="button"
          className={`icon-btn${paused ? " is-off" : ""}`}
          aria-label={paused ? "Play film" : "Pause film"}
          onClick={() => { const v = ref.current; if (!v) return; if (v.paused) v.play().catch(() => {}); else v.pause(); }}
        >
          {paused ? (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path className="solid" d="M7 4l13 8-13 8z" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true"><path className="solid" d="M7.5 4h3.2v16H7.5zM13.3 4h3.2v16h-3.2z" /></svg>
          )}
        </button>
      </div>
    </>
  );
}

/**
 * Off-screen, skipped by keyboard, ignored by autofill — so a human never
 * fills it and a form-filling bot always does. A non-empty `website` is
 * answered with a 200 server-side, which retires the bot instead of teaching
 * it to try again.
 */
function Honeypot() {
  return (
    <div className="hp" aria-hidden="true">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

const MESSAGE_LIMIT = 200;

/**
 * Label and control. The label stays visible: a placeholder vanishes the
 * moment someone types, which is exactly when they want to check what the
 * field was — and on the dark card a translucent placeholder was reading at
 * 2.3:1 besides. Format hints stay in the placeholder, where they belong.
 */
function Field({ id, label, required, children }: {
  id: string; label: string; required?: boolean; children: ReactNode;
}) {
  return (
    <div className="f">
      {/* The asterisk is decorative — `required` on the control is what
          assistive tech announces. */}
      <label htmlFor={id}>{label}{required ? <span className="f__req" aria-hidden="true"> *</span> : null}</label>
      {children}
    </div>
  );
}

/** Enquiry card in the contact section. */
export function ContactForm() {
  const [count, setCount] = useState(0);
  const { status, busy, onSubmit, statusClass } = useSubmit(
    (get) => ({
      form: "contact",
      name: get("name"),
      email: get("email").toLowerCase(),
      mobile: get("mobile"),
      purpose: get("purpose"),
      message: get("message").slice(0, MESSAGE_LIMIT),
      website: get("website"),
    }),
    ENQUIRY_NOTE,
    () => setCount(0),
  );

  return (
    <form className="contact__form" onSubmit={onSubmit}>
      <div className="contact__fields">
        <p className="contact__req"><span className="f__req" aria-hidden="true">*</span> Required</p>

        <Field id="contact-name" label="Full name" required>
          <input className="field" id="contact-name" type="text" name="name" autoComplete="name" required />
        </Field>

        <div className="row">
          <Field id="contact-email" label="Email address" required>
            <input className="field" id="contact-email" type="email" name="email" placeholder="you@company.com" autoComplete="email" required />
          </Field>
          <Field id="contact-mobile" label="Phone">
            <input className="field" id="contact-mobile" type="tel" name="mobile" placeholder="+91 98765 43210" autoComplete="tel" />
          </Field>
        </div>

        <Field id="contact-purpose" label="What brings you here">
          <div className="select-field">
            <select className="field" id="contact-purpose" name="purpose" defaultValue="">
              <option value="" disabled hidden>Choose one</option>
              <option>Partnership or investment</option>
              <option>Distribution or manufacturing</option>
              <option>Research collaboration</option>
              <option>Press</option>
              <option>Careers</option>
              <option>General enquiry</option>
            </select>
          </div>
        </Field>

        <Field id="contact-message" label="Message">
          <div className="textarea-field">
            <textarea
              className="field"
              id="contact-message"
              name="message"
              maxLength={MESSAGE_LIMIT}
              placeholder="Tell us more — optional"
              onChange={(event) => setCount(event.target.value.length)}
            />
            <span className="count" aria-hidden="true">{count}/{MESSAGE_LIMIT}</span>
          </div>
        </Field>

        <Honeypot />

        <button type="submit" className="submit" disabled={busy}>
          {busy ? "Sending…" : "Start with PARVYUKT"}
        </button>
        <p className={statusClass} role="status" aria-live="polite">{status?.text ?? ""}</p>
      </div>
    </form>
  );
}

const CHAR_STEP = 0.022;   // seconds between letters (~1.9s for the full line)

/** Words paired with the index of their first letter, for the reveal delays. */
function splitWords(text: string) {
  let offset = 0;
  return text.split(" ").map((word) => {
    const at = offset;
    offset += word.length + 1;
    return { word, offset: at };
  });
}

/**
 * The vision, set in letters filled with the hero image (white knockout on
 * `screen` blend) that type in once the headline scrolls into view.
 */
export function AboutHeadline({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);

  // Driven by class rather than state: `js-anim` is what hides the letters, so
  // adding it here means a visitor without JS keeps the whole line visible.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("js-anim");
    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-revealed");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          el.classList.add("is-revealed");
          io.disconnect();
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <h2 ref={ref} className="about__headline">
      {/* Eager: the letters ARE this image, so lazy-loading it would flash a
          line of white-on-white text the moment the headline scrolls in. */}
      <Image className="about__headline__media" src="/hero.png" alt="" fill sizes="(max-width: 980px) 92vw, 46vw" loading="eager" />
      <span className="sr-only">{text}</span>
      {/* Letters are per-span so they can type in, but each word is wrapped in a
          nowrap span — otherwise the line breaks between letters mid-word. The
          spaces between words stay plain text nodes, so wrapping still works. */}
      <span className="about__headline__fill" aria-hidden="true">
        {splitWords(text).map(({ word, offset }, index) => (
          <Fragment key={index}>
            {index > 0 && " "}
            <span className="word">
              {[...word].map((char, i) => (
                <span className="char" key={i} style={{ transitionDelay: `${((offset + i) * CHAR_STEP).toFixed(3)}s` }}>{char}</span>
              ))}
            </span>
          </Fragment>
        ))}
      </span>
    </h2>
  );
}

/** Where a clipping frame sits right now, in viewport space. */
function paintedSpan(el: HTMLElement): [number, number] {
  const rect = el.getBoundingClientRect();
  return [rect.top, rect.height];
}

/**
 * The same span, read from layout metrics rather than the painted box.
 * offsetTop and offsetHeight ignore transforms, so an element that moves
 * itself cannot feed its own displacement back into the progress that
 * produced it — which a getBoundingClientRect would do, once per frame,
 * compounding.
 */
function flowSpan(el: HTMLElement, scrolled: number): [number, number] {
  let top = 0;
  for (let node: HTMLElement | null = el; node; node = node.offsetParent as HTMLElement | null) {
    top += node.offsetTop;
  }
  return [top - scrolled, el.offsetHeight];
}

/**
 * Scroll depth for the mid-page acts.
 *
 * Two kinds of layer, and the difference between them is how each is measured.
 *
 * A `.drift` is a decorative or media layer living inside a frame that clips
 * it. It is deliberately larger than that frame, so its own box reports the
 * wrong centre — progress comes from the frame instead. Nothing it does can
 * reach the copy around it, which is what makes its travel safe to set
 * generously.
 *
 * A `.plx` is a content block that moves itself, used from "Why medicinal
 * mushrooms" onward so the columns of those acts read at different depths.
 * It has no frame to measure, and its painted box already carries the
 * transform being derived from it, so progress comes from its layout position.
 * Travel here is deliberately short — this is body copy — and it is always
 * shared by everything stacked in a column, so a moving block can never close
 * the gap above the one below it.
 *
 * This writes one number per layer, `--p`: -1 as the layer enters from the
 * bottom, 0 as it crosses the middle of the viewport, +1 as it leaves the top.
 * CSS multiplies that by the layer's own depth to get the distance.
 */
export function ParallaxScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = ref.current;
    if (!scene) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    type Layer = { el: HTMLElement; frame: HTMLElement | null };
    const pick = (selector: string, framed: boolean): Layer[] =>
      [...scene.querySelectorAll<HTMLElement>(selector)].map((el) => ({
        el,
        frame: framed ? el.parentElement ?? el : null,
      }));

    const layers = [...pick(".drift", true), ...pick(".plx", false)];
    if (!layers.length) return;
    // Only the decorative layers are worth a compositor layer of their own. A
    // promoted box that holds text is rasterised on its own surface, which
    // drops it to greyscale antialiasing — every .plx block would visibly
    // thin out for the length of a scroll and snap back at the end of it.
    const promotable = layers.filter(({ frame }) => frame).map(({ el }) => el);
    // `is-live` is what arms the transform, so without JS — or under reduced
    // motion — every layer renders in its final, readable state instead.
    scene.classList.add("is-live");

    const written = layers.map(() => "");
    let frame = 0;
    let settle = 0;
    let promoted = false;

    const measure = () => {
      frame = 0;
      const half = window.innerHeight / 2;
      const scrolled = window.scrollY;
      // Read every span before writing anything: a custom-property write
      // invalidates style, so interleaving would force a layout per layer, per
      // frame. Batched, it is one layout for the whole scene.
      const spans = layers.map(({ el, frame: box }) =>
        box ? paintedSpan(box) : flowSpan(el, scrolled),
      );
      spans.forEach(([top, height], index) => {
        // Skip anything nowhere near the viewport — offscreen layers should
        // not cost style writes on every frame of a long scroll.
        if (top + height < -half || top > half * 4) return;
        const centre = top + height / 2;
        const progress = Math.max(-1, Math.min(1, (half - centre) / (half * 2)));
        const next = progress.toFixed(3);
        if (written[index] === next) return;
        written[index] = next;
        layers[index].el.style.setProperty("--p", next);
      });
    };

    // will-change is held only while the scroll is actually moving; left on, it
    // pins a compositor layer per layer for the life of the page.
    const release = () => {
      promoted = false;
      for (const el of promotable) el.style.removeProperty("will-change");
    };

    const onScroll = () => {
      if (!promoted) {
        promoted = true;
        for (const el of promotable) el.style.willChange = "transform";
      }
      clearTimeout(settle);
      settle = window.setTimeout(release, 160);
      frame ||= requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(settle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      release();
      scene.classList.remove("is-live");
      for (const { el } of layers) el.style.removeProperty("--p");
    };
  }, []);

  return <div className="scene" ref={ref}>{children}</div>;
}
