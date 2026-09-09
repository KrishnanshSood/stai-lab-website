import assert from "node:assert/strict";
import test, { after } from "node:test";
import { fileURLToPath } from "node:url";
import { createServer } from "vite";

const root = fileURLToPath(new URL("..", import.meta.url));
const vite = await createServer({
  appType: "custom", configFile: false, root,
  resolve: { alias: { "server-only": fileURLToPath(new URL("../node_modules/next/dist/compiled/server-only/empty.js", import.meta.url)) } },
  server: { middlewareMode: true, hmr: false, watch: null },
});
after(() => vite.close());
const { contentResponse } = await vite.ssrLoadModule("/lib/stai-api.ts");
const { siteContent } = await vite.ssrLoadModule("/lib/stai-content.ts");

test("missing configuration fails explicitly instead of serving seed content", async (t) => {
  const previous = { ...process.env };
  t.after(() => { process.env = previous; });
  delete process.env.SUPABASE_URL;
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  delete process.env.SUPABASE_PUBLISHABLE_KEY;
  delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const response = await contentResponse();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(Object.keys(await response.json()), ["error"]);
});

test("a valid response comes from the database and updates on the next request", async (t) => {
  const previous = { ...process.env };
  t.after(() => { process.env = previous; });
  process.env.SUPABASE_URL = "https://example.supabase.co";
  process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
  const live = structuredClone(siteContent);
  live.home.title = "Updated in Supabase";
  t.mock.method(globalThis, "fetch", async () => Response.json([{ content: live }]));
  const response = await contentResponse();
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("X-Content-Source"), "supabase");
  assert.equal((await response.json()).home.title, "Updated in Supabase");
  live.home.title = "Updated again";
  assert.equal((await (await contentResponse()).json()).home.title, "Updated again");
});

for (const [name, makeResponse] of [
  ["database failure", () => Response.json({ message: "private upstream details" }, { status: 403 })],
  ["empty or RLS-filtered content", () => Response.json([])],
  ["malformed content", () => Response.json([{ content: { site: {} } }])],
]) {
  test(`${name} returns a retryable error without exposing upstream details`, async (t) => {
    const previous = { ...process.env };
    t.after(() => { process.env = previous; });
    process.env.SUPABASE_URL = "https://example.supabase.co";
    process.env.SUPABASE_PUBLISHABLE_KEY = "sb_publishable_test";
    t.mock.method(globalThis, "fetch", makeResponse);
    const response = await contentResponse();
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("Retry-After"), "30");
    assert.doesNotMatch(await response.text(), /private upstream details|sb_publishable_test|example.supabase.co/);
  });
}
