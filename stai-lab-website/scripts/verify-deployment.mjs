import assert from "node:assert/strict";

const base = new URL(process.argv[2] || process.env.SITE_URL || "http://localhost:3000");
const headers = process.env.VERCEL_AUTOMATION_BYPASS_SECRET
  ? { "x-vercel-protection-bypass": process.env.VERCEL_AUTOMATION_BYPASS_SECRET }
  : {};

async function request(path) {
  const response = await fetch(new URL(path, base), { headers, signal: AbortSignal.timeout(30000) });
  assert.equal(response.status, 200, `${path} returned ${response.status}`);
  return response;
}

const html = await (await request("/")).text();
assert.match(html, /Safe and Trusted AI Lab/);
const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((match) => match[1]);
assert.ok(scripts.some((src) => src.startsWith("/_next/static/")), "Next.js client scripts are missing");
await Promise.all(scripts.filter((src) => src.startsWith("/")).map(request));
console.log("PASS: page and client JavaScript load");

const paths = ["site", "pages", "people", "publications", "news"];
const data = Object.fromEntries(await Promise.all(paths.map(async (name) => {
  const response = await request(`/api/v1/${name}`);
  assert.match(response.headers.get("content-type"), /application\/json/);
  assert.equal(response.headers.get("x-content-source"), "supabase");
  assert.equal(response.headers.get("cache-control"), "no-store");
  return [name, await response.json()];
})));
assert.equal(data.site.site.name, "Safe and Trusted AI Lab");
for (const key of ["people", "publications", "news"]) assert.deepEqual(data[key], data.site[key], `${key} API disagrees with the site API`);
const pages = Object.fromEntries(Object.entries(data.site).filter(([key]) => !["people", "publications", "news"].includes(key)));
assert.deepEqual(data.pages, pages);
assert.equal(data.site.nav.length, 6);
assert.ok(data.site.thrusts.length > 0);
assert.ok(data.people.pi.name);
console.log(`PASS: all five APIs return consistent Supabase content (${data.site.thrusts.length} research lines, ${data.news.length} news items)`);
