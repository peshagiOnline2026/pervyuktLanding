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
  assert.match(html, /Invitation to partners/i);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("ships all supplied brand assets", async () => {
  const assets = ["pervyukt-lockup.png", "pervyukt-retail-mark.png", "pervyukt-emblem.png", "iso-9001-certificate.jpg", "og.png"];
  await Promise.all(assets.map((asset) => access(new URL(`../public/${asset}`, import.meta.url))));
  const packageJson = await readFile(new URL("../package.json", import.meta.url), "utf8");
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});
