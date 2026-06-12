// OSRS skill data. Hiscores `index_lite` returns skills in THIS exact order
// (note: Attack, Defence, Strength — not Attack, Strength, Defence).
// Row 0 of the response is "Overall" and is skipped before this list.

export const MAX_LEVEL = 99;
export const MAX_SKILL_XP = 13_034_431; // XP required for level 99
export const SKILL_COUNT = 24; // includes Sailing (added 2025)
export const MAX_TOTAL_XP = MAX_SKILL_XP * SKILL_COUNT; // 312,826,344

/** A named training method with a representative XP/hr rate. */
export interface Method {
  /** display label, e.g. "Nightmare Zone" */
  name: string;
  /** approximate community-average XP/hr for this method */
  xpHr: number;
}

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
  /**
   * Popular training methods (low → high XP/hr). Picking one in the UI fills
   * that skill's XP/hr. Rates are rough community averages, not exact.
   */
  methods: Method[];
}

// Ordered to match the OSRS hiscores index_lite response (after Overall).
export const SKILLS: Skill[] = [
  {
    key: "attack",
    name: "Attack",
    icon: "Attack.png",
    defaultXpHr: 250_000,
    methods: [
      { name: "Sand/Ammonite Crabs (AFK)", xpHr: 35_000 },
      { name: "Slayer tasks", xpHr: 45_000 },
      { name: "Nightmare Zone", xpHr: 80_000 },
      { name: "Max gear, aggressive", xpHr: 120_000 },
    ],
  },
  {
    key: "defence",
    name: "Defence",
    icon: "Defence.png",
    defaultXpHr: 250_000,
    methods: [
      { name: "Sand/Ammonite Crabs (AFK)", xpHr: 35_000 },
      { name: "Slayer tasks", xpHr: 45_000 },
      { name: "Nightmare Zone", xpHr: 80_000 },
      { name: "Max gear, aggressive", xpHr: 120_000 },
    ],
  },
  {
    key: "strength",
    name: "Strength",
    icon: "Strength.png",
    defaultXpHr: 250_000,
    methods: [
      { name: "Sand/Ammonite Crabs (AFK)", xpHr: 35_000 },
      { name: "Slayer tasks", xpHr: 45_000 },
      { name: "Nightmare Zone", xpHr: 80_000 },
      { name: "Max gear, aggressive", xpHr: 120_000 },
    ],
  },
  {
    key: "hitpoints",
    name: "Hitpoints",
    icon: "Hitpoints.png",
    defaultXpHr: 300_000,
    methods: [
      { name: "Combat training", xpHr: 55_000 },
      { name: "Nightmare Zone", xpHr: 90_000 },
      { name: "Chinning / bursting", xpHr: 200_000 },
    ],
  },
  {
    key: "ranged",
    name: "Ranged",
    icon: "Ranged.png",
    defaultXpHr: 350_000,
    methods: [
      { name: "Sand Crabs (AFK)", xpHr: 40_000 },
      { name: "Cannon + Slayer", xpHr: 70_000 },
      { name: "Red chinchompas (MM2)", xpHr: 700_000 },
      { name: "Black chins (max)", xpHr: 950_000 },
    ],
  },
  {
    key: "prayer",
    name: "Prayer",
    icon: "Prayer.png",
    defaultXpHr: 500_000,
    methods: [
      { name: "Big bones (altar)", xpHr: 150_000 },
      { name: "Dragon bones (gilded altar)", xpHr: 300_000 },
      { name: "Ensouled heads", xpHr: 500_000 },
      { name: "Superior dragon bones", xpHr: 700_000 },
    ],
  },
  {
    key: "magic",
    name: "Magic",
    icon: "Magic.png",
    defaultXpHr: 250_000,
    methods: [
      { name: "Splashing (AFK)", xpHr: 12_000 },
      { name: "High Alchemy", xpHr: 80_000 },
      { name: "Trident / combat", xpHr: 120_000 },
      { name: "Bursting / barraging Slayer", xpHr: 300_000 },
    ],
  },
  {
    key: "cooking",
    name: "Cooking",
    icon: "Cooking.png",
    defaultXpHr: 500_000,
    methods: [
      { name: "Sharks / fish", xpHr: 150_000 },
      { name: "Wines of Zamorak (1-tick)", xpHr: 470_000 },
      { name: "Karambwans", xpHr: 900_000 },
    ],
  },
  {
    key: "woodcutting",
    name: "Woodcutting",
    icon: "Woodcutting.png",
    defaultXpHr: 100_000,
    methods: [
      { name: "Willows", xpHr: 45_000 },
      { name: "Redwoods (AFK)", xpHr: 70_000 },
      { name: "Sulliuscep (Fossil Is.)", xpHr: 95_000 },
      { name: "Teak (2-tick)", xpHr: 150_000 },
    ],
  },
  {
    key: "fletching",
    name: "Fletching",
    icon: "Fletching.png",
    defaultXpHr: 700_000,
    methods: [
      { name: "Broad bolts", xpHr: 500_000 },
      { name: "Stringing yew/magic bows", xpHr: 600_000 },
      { name: "Adamant darts", xpHr: 800_000 },
      { name: "Dragon darts", xpHr: 1_300_000 },
    ],
  },
  {
    key: "fishing",
    name: "Fishing",
    icon: "Fishing.png",
    defaultXpHr: 100_000,
    methods: [
      { name: "Trout/Salmon (fly)", xpHr: 45_000 },
      { name: "Anglerfish", xpHr: 40_000 },
      { name: "Barbarian fishing (3-tick)", xpHr: 100_000 },
    ],
  },
  {
    key: "firemaking",
    name: "Firemaking",
    icon: "Firemaking.png",
    defaultXpHr: 300_000,
    methods: [
      { name: "Wintertodt", xpHr: 250_000 },
      { name: "Burning logs (line)", xpHr: 270_000 },
      { name: "Yew/magic logs", xpHr: 300_000 },
    ],
  },
  {
    key: "crafting",
    name: "Crafting",
    icon: "Crafting.png",
    defaultXpHr: 300_000,
    methods: [
      { name: "Battlestaves", xpHr: 250_000 },
      { name: "Cutting gems", xpHr: 300_000 },
      { name: "Dragonhide bodies", xpHr: 350_000 },
      { name: "Glassblowing (1-tick)", xpHr: 400_000 },
    ],
  },
  {
    key: "smithing",
    name: "Smithing",
    icon: "Smithing.png",
    defaultXpHr: 300_000,
    methods: [
      { name: "Cannonballs (AFK)", xpHr: 30_000 },
      { name: "Giants' Foundry", xpHr: 230_000 },
      { name: "Blast Furnace (gold)", xpHr: 350_000 },
    ],
  },
  {
    key: "mining",
    name: "Mining",
    icon: "Mining.png",
    defaultXpHr: 125_000,
    methods: [
      { name: "Amethyst (AFK)", xpHr: 25_000 },
      { name: "Motherlode Mine", xpHr: 45_000 },
      { name: "Iron (3-tick)", xpHr: 90_000 },
      { name: "Volcanic Mine", xpHr: 95_000 },
    ],
  },
  {
    key: "herblore",
    name: "Herblore",
    icon: "Herblore.png",
    defaultXpHr: 400_000,
    methods: [
      { name: "Unfinished potions", xpHr: 250_000 },
      { name: "Prayer potions", xpHr: 350_000 },
      { name: "Super/divine potions", xpHr: 450_000 },
    ],
  },
  {
    key: "agility",
    name: "Agility",
    icon: "Agility.png",
    defaultXpHr: 60_000,
    methods: [
      { name: "Rooftop courses", xpHr: 55_000 },
      { name: "Werewolf agility", xpHr: 60_000 },
      { name: "Hallowed Sepulchre", xpHr: 90_000 },
    ],
  },
  {
    key: "thieving",
    name: "Thieving",
    icon: "Thieving.png",
    defaultXpHr: 250_000,
    methods: [
      { name: "Master Farmers", xpHr: 120_000 },
      { name: "Blackjacking", xpHr: 220_000 },
      { name: "Ardougne Knights", xpHr: 250_000 },
      { name: "Pyramid Plunder", xpHr: 280_000 },
    ],
  },
  {
    key: "slayer",
    name: "Slayer",
    icon: "Slayer.png",
    defaultXpHr: 60_000,
    methods: [
      { name: "Standard tasks", xpHr: 25_000 },
      { name: "Cannon tasks", xpHr: 50_000 },
      { name: "Burst/barrage tasks", xpHr: 70_000 },
    ],
  },
  {
    key: "farming",
    name: "Farming",
    icon: "Farming.png",
    defaultXpHr: 500_000,
    methods: [
      { name: "Tithe Farm", xpHr: 100_000 },
      { name: "Hardwood/fruit trees", xpHr: 400_000 },
      { name: "Tree & herb runs (effective)", xpHr: 600_000 },
    ],
  },
  {
    key: "runecraft",
    name: "Runecraft",
    icon: "Runecraft.png",
    defaultXpHr: 50_000,
    methods: [
      { name: "Guardians of the Rift", xpHr: 42_000 },
      { name: "Blood runes", xpHr: 48_000 },
      { name: "Lava runes (binding)", xpHr: 55_000 },
      { name: "Wrath runes (max)", xpHr: 70_000 },
    ],
  },
  {
    key: "hunter",
    name: "Hunter",
    icon: "Hunter.png",
    defaultXpHr: 150_000,
    methods: [
      { name: "Birdhouses (passive)", xpHr: 25_000 },
      { name: "Herbiboar", xpHr: 90_000 },
      { name: "Maniacal monkeys", xpHr: 130_000 },
      { name: "Red/black chinchompas", xpHr: 150_000 },
    ],
  },
  {
    key: "construction",
    name: "Construction",
    icon: "Construction.png",
    defaultXpHr: 500_000,
    methods: [
      { name: "Mahogany Homes", xpHr: 200_000 },
      { name: "Oak dungeon doors", xpHr: 500_000 },
      { name: "Mahogany tables (butler)", xpHr: 700_000 },
    ],
  },
  {
    key: "sailing",
    name: "Sailing",
    icon: "Sailing.png",
    defaultXpHr: 80_000,
    methods: [
      { name: "Casual sailing", xpHr: 60_000 },
      { name: "Mini-games", xpHr: 90_000 },
      { name: "Efficient routes", xpHr: 110_000 },
    ],
  },
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
