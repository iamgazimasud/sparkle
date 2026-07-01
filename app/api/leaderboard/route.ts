import { NextResponse } from "next/server";
import { getMonthlyLeaderboard, getPreviousMonthWinner } from "@/lib/leaderboard";

// GET /api/leaderboard -> this month's top makers + last month's champion
export async function GET() {
  const [current, previousMonth] = await Promise.all([
    getMonthlyLeaderboard(20),
    getPreviousMonthWinner(),
  ]);
  return NextResponse.json({ ...current, previousMonth });
}
