import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getFeed } from "@/lib/shape";

// GET /api/feed?type=art -> the newsfeed (posts + re-shares, newest first)
export async function GET(req: Request) {
  const type = new URL(req.url).searchParams.get("type") || "all";
  const viewer = await getCurrentUser();
  const items = await getFeed({ type, viewerId: viewer?.id ?? null });
  return NextResponse.json({ items });
}
