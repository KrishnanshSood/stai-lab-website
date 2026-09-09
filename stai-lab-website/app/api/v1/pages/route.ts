import { contentResponse } from "@/lib/stai-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return contentResponse((content) => Object.fromEntries(
    Object.entries(content).filter(([key]) => !["publications", "people", "news"].includes(key)),
  ));
}
