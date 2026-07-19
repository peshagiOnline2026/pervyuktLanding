import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the PARVYUKT landing page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
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
