import { contentResponse } from "@/lib/stai-api";

export const dynamic = "force-dynamic";

export async function GET() {
  return contentResponse((content) => content.publications);
}
