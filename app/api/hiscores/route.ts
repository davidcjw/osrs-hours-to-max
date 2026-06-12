import { NextResponse } from "next/server";
import { fetchHiscores } from "@/lib/hiscores";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const result = await fetchHiscores(searchParams.get("username") ?? "");

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { username, totalLevel, progress, accountType } = result;
  return NextResponse.json({ username, totalLevel, progress, accountType });
}
