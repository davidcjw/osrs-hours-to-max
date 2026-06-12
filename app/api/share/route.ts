import { NextResponse } from "next/server";
import { getShareCount, incrementShareCount } from "@/lib/shares";

export const dynamic = "force-dynamic";

// GET — current share count.
export async function GET() {
  const count = await getShareCount();
  return NextResponse.json({ count: count ?? 0 });
}

// POST — register a share and return the new total.
export async function POST() {
  const count = await incrementShareCount();
  return NextResponse.json({ count: count ?? 0 });
}
