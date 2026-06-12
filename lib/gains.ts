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

export interface GainSpan {
  /** total XP gained over the period (>= 0) */
  xp: number;
  /** number of days the period covers (>= 0) */
  days: number;
}

/** Encode gains into a single URL path segment, e.g. "1234567-3". */
export function formatSpan(xp: number, days: number): string {
  const x = Math.max(0, Math.floor(xp));
  const d = Math.max(0, Math.floor(days));
  return `${x}-${d}`;
}

/** Parse the "{xp}-{days}" path segment. Returns null on anything malformed. */
export function parseSpan(span: string): GainSpan | null {
  const m = /^(\d+)-(\d+)$/.exec(span);
  if (!m) return null;
  const xp = Number(m[1]);
  const days = Number(m[2]);
  if (!Number.isFinite(xp) || !Number.isFinite(days)) return null;
  // Guard against absurd values (12 skills * 200m headroom is well under this).
  if (xp > 5_000_000_000) return null;
  if (days > 100_000) return null;
  return { xp, days };
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
