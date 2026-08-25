import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

// `next build` prerenders the static landing page to this file.
const RENDERED_HTML_URL = new URL("../.next/server/app/index.html", import.meta.url);

test("server-renders the PARVYUKT landing page", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");
  assert.match(html, /<title>PARVYUKT — Healing The Healthy Way<\/title>/i);
  assert.match(html, /Healing the healthy way/i);
  assert.match(html, /From Himalayan farms to your daily life/i);
  assert.match(html, /ISO 9001:2015 certified/i);
  assert.match(html, /Let’s shape the next chapter/i);
  assert.match(html, /Start with PARVYUKT/i);
  assert.match(html, /From Himalayan farms to your daily life/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("renders every section of the page", async () => {
  const html = await readFile(RENDERED_HTML_URL, "utf8");
  const sections = [
    "site-header", "hero__content", "hero__bg", "about__headline",
    "mission__quote", "act__head", "act__body", "stats", "stages",
    "act__pair", "cert", "peshagi", "serve__list", "founder",
    "contact__form", "footer",
  ];
  for (const cls of sections) {
    assert.match(html, new RegExp(`class="[^"]*\\b${cls}\\b`), `missing .${cls}`);
  }
  // The vision reads as one line for assistive tech even though the visible
  // headline is split into per-letter spans.
  assert.match(html, /inspire every human to find happiness through natural healing/i);

  // The mid-page is four acts, not eight stacked sections — that consolidation
  // is the whole point of the layout, so a regression back to one-per-beat
  // should fail here.
  const acts = html.match(/class="act[ "]/g) ?? [];
  assert.equal(acts.length, 4, `expected 4 acts, saw ${acts.length}`);
  // Each act still has to be reachable by its original anchor.
  for (const id of ["story", "mushrooms", "platform", "science", "impact", "meaning"]) {
    assert.match(html, new RegExp(`id="${id}"`), `missing #${id}`);
  }

  // Two parallax mechanisms, and each has to stay recognisable. Every drift
  // layer is decorative or media and must declare which kind it is, so an
  // untyped one — with no clipping frame and no travel distance behind it —
  // fails here rather than escaping into the copy.
  assert.match(html, /<div class="scene">/, "the acts need a parallax scope");
  const drifts = html.match(/class="[^"]*\bdrift\b[^"]*"/g) ?? [];
  assert.ok(drifts.length >= 3 && drifts.length <= 8,
    `expected 3-8 drift layers, saw ${drifts.length}`);
  for (const d of drifts) {
    assert.match(d, /drift--(glow|spore|mark|cert|haze|bloom)/, `untyped drift layer: ${d}`);
  }

  // Content blocks move too, but only from "Why medicinal mushrooms" on: the
  // hero and Act I are the reader's footing, and copy that shifts underneath
  // them there costs more than the depth is worth.
  const plx = html.match(/class="[^"]*\bplx\b[^"]*"/g) ?? [];
  assert.ok(plx.length >= 8, `expected the later acts to carry depth, saw ${plx.length}`);
  assert.ok(html.indexOf('plx') > html.indexOf('id="mushrooms"'),
    "content parallax starts before #mushrooms");
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
