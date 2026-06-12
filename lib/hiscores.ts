import { SKILLS, type SkillProgress } from "./skills";

export interface ParsedHiscores {
  totalLevel: number;
  progress: Record<string, SkillProgress>;
}

// The OSRS hiscores API blocks browser CORS, so all lookups go server-side.
// Each account type has its own board; an account is listed on the main board
// plus every board for its mode (Ironman on ironman, HCIM also on hardcore,
// UIM also on ultimate). That's how we detect the badge below.
const HISCORE_MODES = {
  main: "hiscore_oldschool",
  ironman: "hiscore_oldschool_ironman",
  hardcore: "hiscore_oldschool_hardcore_ironman",
  ultimate: "hiscore_oldschool_ultimate",
} as const;

const hiscoreUrl = (mode: string, username: string) =>
  `https://secure.runescape.com/m=${mode}/index_lite.ws?player=${encodeURIComponent(
    username
  )}`;

const HISCORE_HEADERS = { "User-Agent": "osrs-hours-to-max (fan tool)" };

/** Account type, derived from which hiscores boards the player appears on. */
export type AccountType = "normal" | "ironman" | "hardcore" | "ultimate";

export type HiscoresResult =
  | {
      ok: true;
      username: string;
      totalLevel: number;
      progress: Record<string, SkillProgress>;
      accountType: AccountType;
    }
  | { ok: false; status: number; error: string };

/**
 * Validate, fetch and parse a player's hiscores. Used by both the API route
 * and the server-rendered /u/[username] page so behaviour stays identical.
 */
export async function fetchHiscores(rawUsername: string): Promise<HiscoresResult> {
  const username = (rawUsername ?? "").trim();
  if (!username) return { ok: false, status: 400, error: "Missing username." };
  if (!isValidUsername(username)) {
    return {
      ok: false,
      status: 400,
      error: "Invalid username. Use 1-12 letters, numbers, spaces, _ or -.",
    };
  }

  let res: Response;
  try {
    res = await fetch(hiscoreUrl(HISCORE_MODES.main, username), {
      headers: HISCORE_HEADERS,
      cache: "no-store",
    });
  } catch {
    return {
      ok: false,
      status: 502,
      error: "Could not reach the OSRS hiscores. Try again.",
    };
  }

  if (res.status === 404) {
    return {
      ok: false,
      status: 404,
      error: `Player "${username}" not found on the hiscores.`,
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      status: 502,
      error: `Hiscores returned ${res.status}. Try again later.`,
    };
  }

  try {
    const text = await res.text();
    const { totalLevel, progress } = parseHiscores(text);
    const accountType = await detectAccountType(username, overallXp(text));
    return { ok: true, username, totalLevel, progress, accountType };
  } catch {
    return { ok: false, status: 502, error: "Unexpected response from hiscores." };
  }
}

/** Overall (total) XP from a hiscores body — first row, third field. */
function overallXp(body: string): number {
  const xp = parseInt(body.trim().split("\n")[0]?.split(",")[2] ?? "", 10);
  return Number.isFinite(xp) ? Math.max(0, xp) : 0;
}

// `a` is meaningfully ahead of `b`. The ~0.1% slack absorbs indexing lag
// between the separate hiscores boards so we don't misread an active account.
const isAhead = (a: number, b: number) => a > b * 1.001;

/**
 * Detect Ironman status from the hiscores boards. Presence alone is NOT enough,
 * because a board freezes a player's XP when they lose that status while the
 * boards they keep stay live:
 *  - **De-ironed**: frozen on the Ironman board, still climbing on the main
 *    board → if main XP is ahead, they're a normal account again.
 *  - **Dead Hardcore Ironman**: frozen on the hardcore board, still climbing on
 *    the Ironman board → if Ironman XP is ahead, they died and are a regular
 *    Ironman now. (Common — dead HCIM stay listed on the hardcore board forever,
 *    so a presence-only check labels nearly every ex-hardcore account "hardcore".)
 * So we compare XP across boards. Any failure → "normal".
 */
async function detectAccountType(
  username: string,
  mainXp: number
): Promise<AccountType> {
  try {
    const [ironman, hardcore, ultimate] = await Promise.all([
      fetchBoardXp(HISCORE_MODES.ironman, username),
      fetchBoardXp(HISCORE_MODES.hardcore, username),
      fetchBoardXp(HISCORE_MODES.ultimate, username),
    ]);
    // Not an Ironman at all, or de-ironed (main board pulled ahead).
    if (ironman === null || isAhead(mainXp, ironman)) return "normal";
    if (ultimate !== null) return "ultimate";
    // Hardcore only while alive — once dead, the Ironman board pulls ahead of
    // the frozen hardcore board.
    if (hardcore !== null && !isAhead(ironman, hardcore)) return "hardcore";
    return "ironman";
  } catch {
    return "normal";
  }
}

/** Overall XP on the given board, or null if the player isn't listed (404). */
async function fetchBoardXp(
  mode: string,
  username: string
): Promise<number | null> {
  try {
    const res = await fetch(hiscoreUrl(mode, username), {
      headers: HISCORE_HEADERS,
      cache: "no-store",
    });
    if (!res.ok) return null;
    return overallXp(await res.text());
  } catch {
    return null;
  }
}

/** OSRS names: 1-12 chars, letters/numbers/space/underscore/hyphen. */
export function isValidUsername(name: string): boolean {
  return /^[a-zA-Z0-9 _-]{1,12}$/.test(name);
}

/**
 * Parse the OSRS `index_lite` hiscores CSV body.
 * Row 0 is Overall; rows 1..N are skills in SKILLS order, each `rank,level,xp`.
 * Unranked entries come back as -1 and are floored to 0 / level 1.
 * Throws if the body is too short to contain all skills.
 */
export function parseHiscores(text: string): ParsedHiscores {
  const lines = text.trim().split("\n");
  if (lines.length < SKILLS.length + 1) {
    throw new Error("Unexpected response from hiscores.");
  }

  const progress: Record<string, SkillProgress> = {};
  SKILLS.forEach((skill, i) => {
    const parts = lines[i + 1].split(","); // +1 skips the Overall row
    const level = parseInt(parts[1] ?? "1", 10);
    const xp = parseInt(parts[2] ?? "0", 10);
    progress[skill.key] = {
      key: skill.key,
      level: Number.isFinite(level) && level > 0 ? level : 1,
      xp: Number.isFinite(xp) && xp > 0 ? xp : 0,
    };
  });

  const overallParts = lines[0].split(",");
  const totalLevel = parseInt(overallParts[1] ?? "0", 10);

  return {
    totalLevel: Number.isFinite(totalLevel) && totalLevel > 0 ? totalLevel : 0,
    progress,
  };
}
