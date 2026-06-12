import { SKILLS, type SkillProgress } from "./skills";

export interface ParsedHiscores {
  totalLevel: number;
  progress: Record<string, SkillProgress>;
}

/** OSRS names: 1-12 chars, letters/numbers/space/underscore/hyphen. */
export function isValidUsername(name: string): boolean {
  return /^[a-zA-Z0-9 _-]{1,12}$/.test(name);
}

/**
 * Parse the OSRS `index_lite` hiscores CSV body.
 * Row 0 is Overall; rows 1..23 are skills in SKILLS order, each `rank,level,xp`.
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
