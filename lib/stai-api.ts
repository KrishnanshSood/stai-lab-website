import "server-only";
import { siteDataSchema, type SiteData } from "./stai-schema";

class ContentError extends Error {}

async function readSiteContent(): Promise<SiteData> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new ContentError("Supabase URL or publishable key is missing.");
  if (!key.startsWith("sb_publishable_")) throw new ContentError("A Supabase publishable key is required.");

  const endpoint = new URL("/rest/v1/stai_site_content", url);
  endpoint.search = new URLSearchParams({ id: "eq.main", published: "eq.true", select: "content", limit: "1" }).toString();
  const response = await fetch(endpoint, {
    headers: { apikey: key, Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new ContentError(`Supabase Data API returned HTTP ${response.status}.`);

  const rows: unknown = await response.json();
  if (!Array.isArray(rows) || rows.length !== 1 || !rows[0]?.content) {
    throw new ContentError("Published STAI website content is missing or is not readable under RLS.");
  }
  const parsed = siteDataSchema.safeParse(rows[0].content);
  if (!parsed.success) {
    throw new ContentError(`STAI content has an invalid shape at ${parsed.error.issues.map((issue) => issue.path.join(".")).join(", ")}.`);
  }
  return parsed.data;
}

export async function contentResponse(select: (content: SiteData) => unknown = (content) => content) {
  try {
    const content = await readSiteContent();
    return Response.json(select(content), {
      headers: { "Cache-Control": "no-store", "X-Content-Source": "supabase" },
    });
  } catch (error) {
    // Log diagnostics without credentials, database content, or upstream response bodies.
    console.error("[stai-content]", error instanceof ContentError ? error.message : "Supabase content request failed.");
    return Response.json({ error: "The lab content is temporarily unavailable. Please try again shortly." }, {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "30" },
    });
  }
}
