import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("Next.js renders the public page and its client entry point", async () => {
  const html = await readFile(new URL("../.next/server/app/index.html", import.meta.url), "utf8");
  assert.match(html, /Safe and Trusted AI Lab/);
  assert.match(html, /<html[^>]*lang="en"/);
  assert.match(html, /\/_next\/static\/[^"\s]+\.js/);
});
