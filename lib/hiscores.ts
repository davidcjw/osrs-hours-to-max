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
    const { totalLevel, progress } = parseHiscores(await res.text());
    const accountType = await detectAccountType(username);
    return { ok: true, username, totalLevel, progress, accountType };
  } catch {
    return { ok: false, status: 502, error: "Unexpected response from hiscores." };
  }
}

/**
 * Detect Ironman status from which boards the player is listed on. Checked
 * most-specific first: UIM and HCIM both also appear on the Ironman board, so
 * ultimate/hardcore win over plain ironman. A normal account 404s on the
 * Ironman board. Purely presence-based — a de-ironed account still lingering
 * on the Ironman board may read as "ironman", but it's a cosmetic badge so we
 * don't XP-compare boards to catch that rare case. Any failure → "normal".
 */
async function detectAccountType(username: string): Promise<AccountType> {
  try {
    const [ultimate, hardcore, ironman] = await Promise.all([
      isOnBoard(HISCORE_MODES.ultimate, username),
      isOnBoard(HISCORE_MODES.hardcore, username),
      isOnBoard(HISCORE_MODES.ironman, username),
    ]);
    if (ultimate) return "ultimate";
    if (hardcore) return "hardcore";
    if (ironman) return "ironman";
    return "normal";
  } catch {
    return "normal";
  }
}

/** True if the player is listed on the given hiscores board (200 vs 404). */
async function isOnBoard(mode: string, username: string): Promise<boolean> {
  try {
    const res = await fetch(hiscoreUrl(mode, username), {
      headers: HISCORE_HEADERS,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
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
