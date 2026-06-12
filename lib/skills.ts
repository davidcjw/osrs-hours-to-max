// OSRS skill data. Hiscores `index_lite` returns skills in THIS exact order
// (note: Attack, Defence, Strength — not Attack, Strength, Defence).
// Row 0 of the response is "Overall" and is skipped before this list.

export const MAX_LEVEL = 99;
export const MAX_SKILL_XP = 13_034_431; // XP required for level 99
export const SKILL_COUNT = 23;
export const MAX_TOTAL_XP = MAX_SKILL_XP * SKILL_COUNT; // 299,791,913

export interface Skill {
  /** key used in form state / hiscores parsing */
  key: string;
  /** display name */
  name: string;
  /** icon file in /public/icons */
  icon: string;
  /**
   * Reasonable average XP/hr for a mid-level account training this skill
   * with common methods. Used as the default when the user leaves it blank.
   */
  defaultXpHr: number;
}

// Ordered to match the OSRS hiscores index_lite response (after Overall).
export const SKILLS: Skill[] = [
  { key: "attack", name: "Attack", icon: "Attack.png", defaultXpHr: 250_000 },
  { key: "defence", name: "Defence", icon: "Defence.png", defaultXpHr: 250_000 },
  { key: "strength", name: "Strength", icon: "Strength.png", defaultXpHr: 250_000 },
  { key: "hitpoints", name: "Hitpoints", icon: "Hitpoints.png", defaultXpHr: 300_000 },
  { key: "ranged", name: "Ranged", icon: "Ranged.png", defaultXpHr: 350_000 },
  { key: "prayer", name: "Prayer", icon: "Prayer.png", defaultXpHr: 500_000 },
  { key: "magic", name: "Magic", icon: "Magic.png", defaultXpHr: 250_000 },
  { key: "cooking", name: "Cooking", icon: "Cooking.png", defaultXpHr: 500_000 },
  { key: "woodcutting", name: "Woodcutting", icon: "Woodcutting.png", defaultXpHr: 100_000 },
  { key: "fletching", name: "Fletching", icon: "Fletching.png", defaultXpHr: 700_000 },
  { key: "fishing", name: "Fishing", icon: "Fishing.png", defaultXpHr: 100_000 },
  { key: "firemaking", name: "Firemaking", icon: "Firemaking.png", defaultXpHr: 300_000 },
  { key: "crafting", name: "Crafting", icon: "Crafting.png", defaultXpHr: 300_000 },
  { key: "smithing", name: "Smithing", icon: "Smithing.png", defaultXpHr: 300_000 },
  { key: "mining", name: "Mining", icon: "Mining.png", defaultXpHr: 125_000 },
  { key: "herblore", name: "Herblore", icon: "Herblore.png", defaultXpHr: 400_000 },
  { key: "agility", name: "Agility", icon: "Agility.png", defaultXpHr: 60_000 },
  { key: "thieving", name: "Thieving", icon: "Thieving.png", defaultXpHr: 250_000 },
  { key: "slayer", name: "Slayer", icon: "Slayer.png", defaultXpHr: 60_000 },
  { key: "farming", name: "Farming", icon: "Farming.png", defaultXpHr: 500_000 },
  { key: "runecraft", name: "Runecraft", icon: "Runecraft.png", defaultXpHr: 50_000 },
  { key: "hunter", name: "Hunter", icon: "Hunter.png", defaultXpHr: 150_000 },
  { key: "construction", name: "Construction", icon: "Construction.png", defaultXpHr: 500_000 },
];

export interface SkillProgress {
  key: string;
  /** current XP from hiscores (clamped to >= 0) */
  xp: number;
  /** current level from hiscores */
  level: number;
}

export interface MaxResult {
  key: string;
  name: string;
  icon: string;
  currentXp: number;
  level: number;
  remainingXp: number;
  xpHr: number;
  /** whether xpHr was a user override or the default */
  usedDefault: boolean;
  hours: number;
  maxed: boolean;
}

/**
 * Compute hours-to-max per skill and in total.
 * @param progress current XP per skill key (from hiscores)
 * @param rates    user-supplied XP/hr per skill key (blank/0 => use default)
 */
export function computeHoursToMax(
  progress: Record<string, SkillProgress>,
  rates: Record<string, number | "">
): { rows: MaxResult[]; totalHours: number; totalRemainingXp: number; alreadyMaxed: boolean } {
  const rows: MaxResult[] = SKILLS.map((skill) => {
    const p = progress[skill.key];
    const currentXp = p ? Math.max(0, p.xp) : 0;
    const level = p ? p.level : 1;
    const remainingXp = Math.max(0, MAX_SKILL_XP - currentXp);

    const rawRate = rates[skill.key];
    const hasOverride = typeof rawRate === "number" && rawRate > 0;
    const xpHr = hasOverride ? rawRate : skill.defaultXpHr;

    const hours = remainingXp > 0 ? remainingXp / xpHr : 0;

    return {
      key: skill.key,
      name: skill.name,
      icon: skill.icon,
      currentXp,
      level,
      remainingXp,
      xpHr,
      usedDefault: !hasOverride,
      hours,
      maxed: remainingXp === 0,
    };
  });

  const totalHours = rows.reduce((sum, r) => sum + r.hours, 0);
  const totalRemainingXp = rows.reduce((sum, r) => sum + r.remainingXp, 0);
  const alreadyMaxed = totalRemainingXp === 0;

  return { rows, totalHours, totalRemainingXp, alreadyMaxed };
}

/** Format hours into "Xd Yh" / "Yh Zm" friendly text. */
export function formatDuration(hours: number): string {
  if (hours <= 0) return "0h";
  const totalMinutes = Math.round(hours * 60);
  const days = Math.floor(totalMinutes / (60 * 24));
  const h = Math.floor((totalMinutes % (60 * 24)) / 60);
  const m = totalMinutes % 60;
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0 && days === 0) parts.push(`${m}m`);
  return parts.length ? parts.join(" ") : "0h";
}

export function formatNumber(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
