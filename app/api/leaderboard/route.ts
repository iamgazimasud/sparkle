import { NextResponse } from "next/server";
import { getMonthlyLeaderboard } from "@/lib/leaderboard";

// GET /api/leaderboard -> this month's top makers
export async function GET() {
  const data = await getMonthlyLeaderboard(20);
  return NextResponse.json(data);
}
