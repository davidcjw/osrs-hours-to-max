import { NextResponse } from "next/server";
import { isValidUsername, parseHiscores } from "@/lib/hiscores";

// The OSRS hiscores API blocks browser CORS, so we proxy it server-side.
const HISCORES_URL =
  "https://secure.runescape.com/m=hiscore_oldschool/index_lite.ws?player=";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = (searchParams.get("username") ?? "").trim();

  if (!username) {
    return NextResponse.json({ error: "Missing username." }, { status: 400 });
  }
  if (!isValidUsername(username)) {
    return NextResponse.json(
      { error: "Invalid username. Use 1-12 letters, numbers, spaces, _ or -." },
      { status: 400 }
    );
  }

  let res: Response;
  try {
    res = await fetch(HISCORES_URL + encodeURIComponent(username), {
      headers: { "User-Agent": "osrs-hours-to-max (fan tool)" },
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { error: "Could not reach the OSRS hiscores. Try again." },
      { status: 502 }
    );
  }

  if (res.status === 404) {
    return NextResponse.json(
      { error: `Player "${username}" not found on the hiscores.` },
      { status: 404 }
    );
  }
  if (!res.ok) {
    return NextResponse.json(
      { error: `Hiscores returned ${res.status}. Try again later.` },
      { status: 502 }
    );
  }

  try {
    const text = await res.text();
    const { totalLevel, progress } = parseHiscores(text);
    return NextResponse.json({ username, totalLevel, progress });
  } catch {
    return NextResponse.json(
      { error: "Unexpected response from hiscores." },
      { status: 502 }
    );
  }
}
