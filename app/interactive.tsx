"use client";

import Image from "next/image";
import { Fragment, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

// The contact form posts to /api/submit, which is the only thing holding a
// Supabase credential. See app/api/submit/route.ts.
const ENQUIRY_NOTE = "Thanks for reaching out — we’ll be in touch.";
const LIST_NOTE = "You’re on the list — we’ll be in touch.";
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
 * Transparent over the hero, solid once past it.
 *
 * Two things ride on `is-scrolled`. The CTA only appears with the steady bar —
 * over the film there is deliberately nothing to click, so the hero stays a
 * single image. And the mark swaps: the identity ships a light lockup drawn
 * for dark grounds and a dark one for pale grounds, so the bar cross-fades
 * between the two instead of parking the dark mark on a white plate.
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
          {/* Both marks ship in the markup and cross-fade, so going past the
              hero never costs a request and never flashes an empty box. Only
              the light one carries the alt text; the other is its duplicate. */}
          <Image className="logo__mark logo__mark--light" src="/pervyukt-retail-mark-light.png" alt="PARVYUKT" width={1089} height={662} priority />
          <Image className="logo__mark logo__mark--dark" src="/pervyukt-retail-mark.png" alt="" aria-hidden="true" width={1089} height={662} priority />
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
 * The brand film and its own controls, in one frame.
 *
 * The frame is the point: the film no longer carries the hero's copy, so it is
 * a self-contained media block that the headline sits beneath rather than on
 * top of. Mute and pause ride inside that frame at every width — on a phone
 * that is the only place they can go without stealing a row of their own.
 * Both mirror the element's real state via its own events, so the controls are
 * correct from first paint.
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
    <div className="hero__film">
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
    </div>
  );
}

/**
 * Email capture on the hero plate.
 *
 * One field, because that is the whole ask at this point on the page — the
 * enquiry card at the bottom is where someone who wants to say more goes, and
 * asking for a name and a purpose up here only makes the cheap thing look
 * expensive. It posts `form: "signup"`, which is the route's email-only path
 * into pervyukt_signups; the enquiry card posts `form: "contact"` and lands in
 * a different table.
 *
 * A repeat address reads as success, not as an error. The column is unique and
 * the route swallows the resulting 23505 on purpose: telling someone their
 * address is already on the list is useless to them and a membership oracle
 * for anyone else.
 */
export function HeroSignup() {
  const { status, busy, onSubmit, statusClass } = useSubmit(
    (get) => ({ form: "signup", email: get("email").toLowerCase(), website: get("website") }),
    LIST_NOTE,
  );

  return (
    <form className="signup" onSubmit={onSubmit}>
      {/* The visible label the enquiry card insists on would be a third line of
          furniture in a strip that has to stay one band deep, and here the
          placeholder is not carrying the field's identity on its own — the
          button beside it names the action, which a lone "Email address" box
          in a hero does not leave in doubt. The card's fields are a different
          case: several of them, filled in sequence, where a vanished
          placeholder is a real loss. */}
      <label className="sr-only" htmlFor="hero-email">Email address</label>
      <div className="signup__row">
        <input
          className="signup__field"
          id="hero-email"
          type="email"
          name="email"
          placeholder="Email address"
          autoComplete="email"
          required
        />
        <Honeypot />
        <button type="submit" disabled={busy}>{busy ? "Sending…" : "Connect with PARVYUKT"}</button>
      </div>
      <p className={statusClass} role="status" aria-live="polite">{status?.text ?? ""}</p>
    </form>
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
      {/* Decorative contour wash behind the card — the Peshagi enquiry card's
          water layer, carried over unchanged, rose-gold flow and all. Two
          artboards rather than one scaled file: the desktop drawing is 1110x616
          and goes to mush cropped to a phone's tall card, so the narrow build
          is its own. Both stop animating under prefers-reduced-motion, which
          the SVG handles itself — the page's CSS cannot reach SMIL inside an
          <img>. */}
      <picture className="contact__water" aria-hidden="true">
        <source srcSet="/contact-water-mobile.svg" media="(max-width: 600px)" />
        <img src="/contact-water.svg" alt="" />
      </picture>

      <div className="contact__fields">
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
          {busy ? "Sending…" : "Make an impact"}
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
 * The vision, set in letters filled with the brand film — the same film the
 * hero plays — that type in once the headline scrolls into view.
 *
 * The observer does two jobs and so, unlike before, it is never disconnected
 * after the first hit: it types the line in once, and it runs the film only
 * while the line is actually on screen. A second copy of the hero's video
 * decoding continuously behind six lines of type, most of the time far above
 * the fold, is worth more than the branch it costs to avoid.
 */
export function AboutHeadline({ text }: { text: string }) {
  const ref = useRef<HTMLHeadingElement>(null);
  const film = useRef<HTMLVideoElement>(null);

  // Driven by class rather than state: `js-anim` is what hides the letters, so
  // adding it here means a visitor without JS keeps the whole line visible.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add("js-anim");

    const v = film.current;
    if (v) v.muted = true;             // React can drop this attribute on hydration
    // Under reduced motion the poster stands in, exactly as it does in the
    // hero — and the poster here is the still this headline used to carry, so
    // that state is the design it is replacing rather than a blank box.
    const still = !v || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const play = () => { if (!still) v!.play().catch(() => { /* refused; poster stands in */ }); };

    if (!("IntersectionObserver" in window)) {
      el.classList.add("is-revealed");
      play();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-revealed");
            play();
          } else if (!still) {
            v!.pause();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => { io.disconnect(); if (!still) v!.pause(); };
  }, []);

  return (
    <h2 ref={ref} className="about__headline">
      {/* The letters ARE this film. preload="none" because the hero has already
          fetched the same file by the time anyone reaches this far down, so the
          observer's play() comes out of cache; the poster is the still the
          headline used to carry, which makes every state where the video does
          not run — no JS, reduced motion, a refused play — the old design
          rather than an empty box. */}
      <video
        ref={film}
        className="about__headline__media"
        poster="/hero.png"
        preload="none"
        muted
        loop
        playsInline
        aria-hidden="true"
        tabIndex={-1}
      >
        <source src="/hero-film.mp4" type="video/mp4" />
      </video>
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
/**
 * What arrives on scroll, and in what order.
 *
 * Each selector is one stagger group: everything it matches under a single
 * parent arrives in document order, one short beat apart. Lists hand the
 * reveal to their items rather than taking it themselves — a run of figures or
 * numbered stages counting itself in is the whole reason the run is there,
 * and a container fading in over its own children would only mud the two
 * transforms together.
 */
const REVEAL_GROUPS = [
  ".beat__rail > *",
  ".beat__body > *:not(.band):not(.stages):not(.audiences)",
  ".band .stats__item",
  ".stages > li",
  ".audiences > li",
  ".principle",
];

/**
 * Arms the reveal and hands back the observer's disconnect.
 *
 * `js-rv` is what hides an unrevealed block, and only this function adds it —
 * so without JS, and under reduced motion where the caller never gets here,
 * every block renders in its final state.
 *
 * The observer fires a little inside the viewport's bottom edge rather than at
 * it, so a block is already a line or two up the screen when it starts, and
 * unhooks each element as it lands: these run once, and a page this long
 * should not be paying for a live observer on every block it has passed.
 */
function armReveal(scene: HTMLElement) {
  const targets: HTMLElement[] = [];
  for (const selector of REVEAL_GROUPS) {
    const seen = new Map<Element | null, number>();
    for (const el of scene.querySelectorAll<HTMLElement>(selector)) {
      const index = seen.get(el.parentElement) ?? 0;
      seen.set(el.parentElement, index + 1);
      // Capped: past a handful of items the stagger stops reading as rhythm
      // and starts reading as the last one being late.
      el.style.setProperty("--rv-i", String(Math.min(index, 5)));
      el.dataset.rv = "";
      targets.push(el);
    }
  }
  if (!targets.length) return () => {};
  scene.classList.add("js-rv");

  if (!("IntersectionObserver" in window)) {
    for (const el of targets) el.classList.add("is-rv");
    return () => {};
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-rv");
        io.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.05 },
  );
  for (const el of targets) io.observe(el);

  return () => {
    io.disconnect();
    scene.classList.remove("js-rv");
    for (const el of targets) {
      el.classList.remove("is-rv");
      el.style.removeProperty("--rv-i");
      delete el.dataset.rv;
    }
  };
}

export function ParallaxScene({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scene = ref.current;
    if (!scene) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Reveal first, and independently of the depth pass below: it is the one
    // that makes the long middle of the page feel like it is moving, and it
    // has to survive a scene with no parallax layers left in it.
    const disarmReveal = armReveal(scene);

    type Layer = { el: HTMLElement; frame: HTMLElement | null };
    const pick = (selector: string, framed: boolean): Layer[] =>
      [...scene.querySelectorAll<HTMLElement>(selector)].map((el) => ({
        el,
        frame: framed ? el.parentElement ?? el : null,
      }));

    const layers = [...pick(".drift", true), ...pick(".plx", false)];
    if (!layers.length) return disarmReveal;
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
      disarmReveal();
      scene.classList.remove("is-live");
      for (const { el } of layers) el.style.removeProperty("--p");
    };
  }, []);

  return <div className="scene" ref={ref}>{children}</div>;
}
