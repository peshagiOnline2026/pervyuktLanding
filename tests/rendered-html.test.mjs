import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

// `next build` prerenders the static landing page to this file.
const RENDERED_HTML_URL = new URL("../.next/server/app/index.html", import.meta.url);

/** The markup between two landmarks, for assertions scoped to one region. */
function slice(html, from, to) {
  const start = html.indexOf(from);
  assert.notEqual(start, -1, `missing landmark: ${from}`);
  const end = to ? html.indexOf(to, start) : html.length;
  return html.slice(start, end === -1 ? html.length : end);
}

test("server-renders the PARVYUKT landing page", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");
  assert.match(html, /<title>PARVYUKT — Healing The Healthy Way<\/title>/i);
  assert.match(html, /Healing the healthy way/i);
  assert.match(html, /From Himalayan farms to your daily life/i);
  assert.match(html, /ISO 9001:2015 certified/i);
  assert.match(html, /Let’s shape the next chapter/i);
  assert.match(html, /Start with PARVYUKT/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("renders every section of the page", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");
  const sections = [
    "site-header", "site-header__cta", "hero__content", "hero__bg",
    "beat__rail", "beat__body", "about__headline", "mission__quote",
    "stats", "stages", "cert", "peshagi", "audiences", "founder",
    "contact__form", "footer",
  ];
  for (const cls of sections) {
    assert.match(html, new RegExp(`class="[^"]*\\b${cls}\\b`), `missing .${cls}`);
  }
  // The vision reads as one line for assistive tech even though the visible
  // headline is split into per-letter spans.
  assert.match(html, /inspire every human to find happiness through natural healing/i);

  // Every anchor the page has ever published stays reachable.
  for (const id of ["story", "vision", "mushrooms", "platform", "science",
                    "impact", "audiences", "leadership", "meaning", "contact"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }
});

test("the mid-page is a single spine, not unrelated columns", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");

  // The layout rule: a horizontal split is only ever a heading against its own
  // body, or copy against its own supporting media. Every mid-page section is
  // therefore one beat — one idea, one rail, one body — and each rail has
  // exactly one body beside it. A section that grows a second, unrelated
  // column (which is what the earlier "act pair" grids did, and what made the
  // page read as unrelated information travelling horizontally) fails here.
  const beats = html.match(/class="beat[ "]/g) ?? [];
  assert.equal(beats.length, 8, `expected 8 beats, saw ${beats.length}`);
  const rails = html.match(/class="beat__rail"/g) ?? [];
  const bodies = html.match(/class="beat__body"/g) ?? [];
  assert.equal(rails.length, beats.length, "every beat needs a heading rail");
  assert.equal(bodies.length, beats.length, "every rail needs exactly one body");
  assert.doesNotMatch(html, /class="[^"]*\bact__pair\b/, "no unrelated column pairs");

  // Two parallax mechanisms, and each has to stay recognisable. Every drift
  // layer is decorative or media and must declare which kind it is, so an
  // untyped one — with no clipping frame and no travel distance behind it —
  // fails here rather than escaping into the copy.
  assert.match(html, /<div class="scene">/, "the beats need a parallax scope");
  const drifts = html.match(/class="[^"]*\bdrift\b[^"]*"/g) ?? [];
  assert.ok(drifts.length >= 3 && drifts.length <= 8,
    `expected 3-8 drift layers, saw ${drifts.length}`);
  for (const d of drifts) {
    assert.match(d, /drift--(glow|spore|mark)/, `untyped drift layer: ${d}`);
  }
  // A wash only reads as light-on-a-surface inside a tinted card. On plain
  // white behind body copy it reads as a highlighter stroke, so the three that
  // remain are the three that have a card: the mission plate, the figures band
  // and the PESHAGI cell.
  for (const frame of ["mission", "band", "peshagi__mark"]) {
    assert.match(html, new RegExp(`class="[^"]*\\b${frame}\\b[^"]*"[^>]*>\\s*<span class="drift`),
      `.${frame} should be the frame for a drift layer`);
  }

  // Content blocks move too, but never the rail — a transform on a sticky
  // element fights its own offset — and not until "Why medicinal mushrooms":
  // the hero and the first beat are the reader's footing.
  const plx = html.match(/class="[^"]*\bplx\b[^"]*"/g) ?? [];
  assert.ok(plx.length >= 8, `expected the later beats to carry depth, saw ${plx.length}`);
  for (const p of plx) {
    assert.doesNotMatch(p, /\bbeat__rail\b/, "the sticky rail must not be a parallax layer");
  }
  assert.ok(html.indexOf("plx") > html.indexOf('id="mushrooms"'),
    "content parallax starts before #mushrooms");
});

test("the hero is the film and one band of copy", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");
  const hero = slice(html, 'class="hero"', '<div class="scene">');

  // The film's captions are burned in through the middle and lower thirds, so
  // the hero holds no form and no second call to action — those are the header
  // CTA and the enquiry card now.
  assert.doesNotMatch(hero, /<form/, "the hero must not carry a form");
  assert.doesNotMatch(hero, /class="notify/, "the hero capture form is gone");
  assert.match(hero, /Healing the healthy way/, "the h1 stays in the hero");

  // The CTA lives in the header instead, pointing at the enquiry card.
  const header = slice(html, 'class="site-header', 'class="hero"');
  assert.match(header, /class="site-header__cta" href="#contact"/);
  // One mark, on the pale ground it is drawn for: the light variant's forest
  // quadrant is the hero's own green and a quarter of the logo vanished.
  assert.match(header, /pervyukt-retail-mark\.png/);
  assert.doesNotMatch(header, /retail-mark-light/, "the light mark loses its green petals on green");
});

test("carries the supplied company copy", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");
  for (const phrase of [
    "purpose-driven preventive healthcare Agri-innovation company",
    "skin-to-stomach",
    "Turkey Tail",
    "Lion’s Mane",
    "USD 83.6B",
    "11.5%",
    "MDEN research",
    "ISO 9001:2015 certified",
    "PESHAGI",
    "Himalayan Seabuckthorn",
    "Rrahul Dalmia",
    "Dev Bhasha Sanskrit",
    "AYUSH",
  ]) {
    assert.ok(html.includes(phrase), `missing copy: ${phrase}`);
  }
});

test("every heading is a finished sentence", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");
  // Headline fragments that read as unfinished — "Two decades international. A
  // decade in medicinal mushroom research." and its kind — were the specific
  // complaint. Each of these is now a complete sentence; this guards the
  // rewrite rather than the phrasing.
  for (const fragment of [
    "Two decades international",
    "Biotechnology-led, compliance-first",
    "A credible bridge between tradition and evidence",
    ">From spawn to shelf.<",
    ">Full of festivities.<",
  ]) {
    assert.ok(!html.includes(fragment), `sentence fragment is back: ${fragment}`);
  }
  // Every rail heading ends on a full stop, which a fragment rarely does. The
  // bare <h2>s are exactly those: the script titles ("Who we are", the contact
  // line) and the image-filled vision statement all carry a class.
  const headings = [...html.matchAll(/<h2>([\s\S]*?)<\/h2>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").trim());
  assert.equal(headings.length, 7, `expected 7 rail headings, saw ${headings.length}`);
  for (const h of headings) {
    assert.match(h, /[.]$/, `heading is not a finished sentence: "${h}"`);
  }
});

test("every enquiry field keeps a visible label", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");
  const form = slice(html, 'class="contact__form"', "</form>");
  // A placeholder disappears the moment someone types, which is exactly when
  // the field's identity is needed. Placeholders here carry format hints only.
  for (const id of ["contact-name", "contact-email", "contact-mobile",
                    "contact-purpose", "contact-message"]) {
    assert.match(form, new RegExp(`<label for="${id}"`), `${id} has no visible label`);
  }
  assert.doesNotMatch(form, /class="sr-only"/, "enquiry labels must not be screen-reader-only");
  // Semantic types, so mobile keyboards match the field.
  assert.match(form, /id="contact-email"[^>]*type="email"|type="email"[^>]*id="contact-email"/);
  assert.match(form, /id="contact-mobile"[^>]*type="tel"|type="tel"[^>]*id="contact-mobile"/);
});

test("PESHAGI links out, and the footer no longer claims a place", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");
  const panel = slice(html, 'class="peshagi', "</a>");
  assert.match(panel, /href="https:\/\/peshagi\.com"/, "the PESHAGI panel must link out");
  assert.match(panel, /target="_blank"/);
  assert.match(panel, /rel="noopener noreferrer"/, "an external target needs noopener");

  const footer = slice(html, "<footer", "</footer>");
  assert.doesNotMatch(footer, /Uttarakhand/, "the footer no longer names a location");
  assert.match(footer, /Pervyukt Agrinnovaters Private Limited/);
  // Uttarakhand is still the rural-impact story, just not a footer address.
  assert.match(html, /hills of Uttarakhand/);
});

test("ships all supplied brand assets", async () => {
  const assets = [
    "pervyukt-lockup.png",
    "pervyukt-lockup-light.png",
    "pervyukt-retail-mark.png",
    "pervyukt-retail-mark-light.png",
    "pervyukt-emblem.png",
    "iso-9001-certificate.jpg",
    "hero.png",
    "og.png",
  ];
  await Promise.all(assets.map((asset) => access(new URL(`../public/${asset}`, import.meta.url))));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
