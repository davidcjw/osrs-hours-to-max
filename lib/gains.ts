// Pure helpers for the daily progress tracker + shareable "gains" card.

export interface GainTier {
  /** short OSRS-flavoured label */
  label: string;
  /** motivational one-liner shown on the card */
  message: string;
}

/**
 * Motivational copy keyed to how much total XP was gained in the period.
 * Tiers are intentionally OSRS-flavoured and a bit cheeky.
 */
export function gainsMessage(xpGained: number): GainTier {
  const xp = Math.floor(xpGained);
  if (xp <= 0) {
    return {
      label: "Rest Day",
      message: "Taking a breather? Even maxed mains log out sometimes.",
    };
  }
  if (xp < 50_000) {
    return {
      label: "Warming Up",
      message: "Every XP drop counts. Slow and steady wins the cape.",
    };
  }
  if (xp < 250_000) {
    return {
      label: "Grinding",
      message: "Nice session — the grind is real. Keep it rolling!",
    };
  }
  if (xp < 1_000_000) {
    return {
      label: "Locked In",
      message: "Now we're cooking. That's some serious progress!",
    };
  }
  if (xp < 5_000_000) {
    return {
      label: "No-Lifing",
      message: "Certified grinder. The XP is absolutely flowing.",
    };
  }
  if (xp < 20_000_000) {
    return {
      label: "Sweating",
      message: "Absolute sweat. Respect the dedication, scaper.",
    };
  }
  return {
    label: "Legendary",
    message: "Touch grass? Never. This is a legendary grind.",
  };
}

/** A single skill's gained XP, for the per-skill breakdown on the card. */
export interface SkillGain {
  /** skill key (lowercase, matches SKILLS in lib/skills.ts) */
  key: string;
  /** XP gained in this skill (> 0) */
  xp: number;
}

export interface GainSpan {
  /** total XP gained over the period (>= 0) */
  xp: number;
  /** number of days the period covers (>= 0) */
  days: number;
  /** top skills by XP gained (may be empty for older/short links) */
  topSkills: SkillGain[];
}

const MAX_XP = 5_000_000_000;
const MAX_TOP_SKILLS = 4;

/**
 * Encode gains into a single URL path segment, e.g. "1234567-3" or, with a
 * per-skill breakdown, "1234567-3-slayer.800000-agility.300000". Skill keys are
 * lowercase letters only and XP is integer, so "-"/"." are safe separators.
 */
export function formatSpan(
  xp: number,
  days: number,
  topSkills: SkillGain[] = []
): string {
  const x = Math.max(0, Math.floor(xp));
  const d = Math.max(0, Math.floor(days));
  let span = `${x}-${d}`;
  for (const sk of topSkills.slice(0, MAX_TOP_SKILLS)) {
    const kx = Math.max(0, Math.floor(sk.xp));
    if (kx > 0 && /^[a-z]{1,15}$/.test(sk.key)) span += `-${sk.key}.${kx}`;
  }
  return span;
}

/**
 * Parse "{xp}-{days}" with optional "-{key}.{xp}" skill segments. Returns null
 * on anything malformed (any bad trailing segment rejects the whole span).
 */
export function parseSpan(span: string): GainSpan | null {
  const [xpStr, daysStr, ...rest] = span.split("-");
  if (!/^\d+$/.test(xpStr ?? "") || !/^\d+$/.test(daysStr ?? "")) return null;
  const xp = Number(xpStr);
  const days = Number(daysStr);
  if (!Number.isFinite(xp) || !Number.isFinite(days)) return null;
  // Guard against absurd values (24 skills * 200m headroom is well under this).
  if (xp > MAX_XP) return null;
  if (days > 100_000) return null;
  if (rest.length > MAX_TOP_SKILLS) return null;

  const topSkills: SkillGain[] = [];
  for (const token of rest) {
    const m = /^([a-z]{1,15})\.(\d{1,12})$/.exec(token);
    if (!m) return null;
    const skXp = Number(m[2]);
    if (!Number.isFinite(skXp) || skXp > MAX_XP) return null;
    topSkills.push({ key: m[1], xp: skXp });
  }
  return { xp, days, topSkills };
}

/** Compact XP for tight spaces, e.g. 1_234_567 → "1.2M", 450_000 → "450k". */
export function formatXpShort(n: number): string {
  const x = Math.max(0, Math.floor(n));
  const trim = (v: number) => {
    if (v >= 100) return String(Math.round(v));
    const s = v.toFixed(1);
    return s.endsWith(".0") ? s.slice(0, -2) : s;
  };
  if (x >= 999_500) return `${trim(x / 1_000_000)}M`;
  if (x >= 1_000) return `${trim(x / 1_000)}k`;
  return String(x);
}

/** Human phrase for the period length. */
export function formatPeriod(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "in 1 day";
  if (days < 7) return `in ${days} days`;
  if (days < 14) return "in 1 week";
  if (days < 30) return `in ${Math.round(days / 7)} weeks`;
  if (days < 60) return "in 1 month";
  if (days < 365) return `in ${Math.round(days / 30)} months`;
  return `in ${(days / 365).toFixed(1)} years`;
}
