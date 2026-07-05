import { describe, it, expect } from "vitest";
import {
  SKILLS,
  SKILL_COUNT,
  MAX_LEVEL,
  MAX_SKILL_XP,
  MAX_XP,
  xpForLevel,
  levelForXp,
  computeHoursToMax,
  formatDuration,
  formatNumber,
  type SkillProgress,
} from "@/lib/skills";

function progressFrom(xpByKey: Record<string, number>): Record<string, SkillProgress> {
  const out: Record<string, SkillProgress> = {};
  for (const skill of SKILLS) {
    out[skill.key] = { key: skill.key, xp: xpByKey[skill.key] ?? 0, level: 1 };
  }
  return out;
}

describe("skill data", () => {
  it("has exactly 24 skills (incl. Sailing)", () => {
    expect(SKILLS).toHaveLength(SKILL_COUNT);
    expect(SKILL_COUNT).toBe(24);
    expect(SKILLS[SKILLS.length - 1].key).toBe("sailing");
  });

  it("orders skills to match the hiscores response (Attack, Defence, Strength...)", () => {
    expect(SKILLS.slice(0, 4).map((s) => s.key)).toEqual([
      "attack",
      "defence",
      "strength",
      "hitpoints",
    ]);
  });

  it("every skill has a positive default XP/hr", () => {
    for (const s of SKILLS) expect(s.defaultXpHr).toBeGreaterThan(0);
  });

  it("every skill has at least two named method presets", () => {
    for (const s of SKILLS) {
      expect(s.methods.length).toBeGreaterThanOrEqual(2);
      for (const m of s.methods) {
        expect(m.name.trim().length).toBeGreaterThan(0);
        expect(m.xpHr).toBeGreaterThan(0);
        expect(Number.isInteger(m.xpHr)).toBe(true);
      }
    }
  });

  it("has unique method names and unique XP/hr per skill (so presets map 1:1 to a rate)", () => {
    for (const s of SKILLS) {
      const names = s.methods.map((m) => m.name);
      const rates = s.methods.map((m) => m.xpHr);
      expect(new Set(names).size).toBe(names.length);
      expect(new Set(rates).size).toBe(rates.length);
    }
  });
});

describe("xpForLevel (XP-per-level table lookup)", () => {
  it("level 1 is 0 XP", () => {
    expect(xpForLevel(1)).toBe(0);
  });

  it("matches known OSRS table entries", () => {
    expect(xpForLevel(2)).toBe(83);
    expect(xpForLevel(10)).toBe(1154);
    expect(xpForLevel(92)).toBe(6_517_253); // the classic "92 is halfway to 99"
  });

  it("level 99 equals MAX_SKILL_XP (13,034,431)", () => {
    expect(xpForLevel(99)).toBe(MAX_SKILL_XP);
    expect(xpForLevel(MAX_LEVEL)).toBe(13_034_431);
  });

  it("is strictly increasing across the whole table", () => {
    for (let lvl = 2; lvl <= MAX_LEVEL; lvl++) {
      expect(xpForLevel(lvl)).toBeGreaterThan(xpForLevel(lvl - 1));
    }
  });

  it("clamps out-of-range levels into 1..99", () => {
    expect(xpForLevel(0)).toBe(0);
    expect(xpForLevel(-5)).toBe(0);
    expect(xpForLevel(150)).toBe(MAX_SKILL_XP);
    expect(xpForLevel(50.9)).toBe(xpForLevel(50)); // floors fractional input
  });
});

describe("levelForXp (inverse table lookup)", () => {
  it("0 XP (and negative/unranked) is level 1", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(-1)).toBe(1);
    expect(levelForXp(82)).toBe(1); // one short of level 2
  });

  it("returns the level exactly at each threshold", () => {
    expect(levelForXp(83)).toBe(2);
    expect(levelForXp(xpForLevel(50))).toBe(50);
    expect(levelForXp(xpForLevel(70) + 1)).toBe(70); // just past a threshold
  });

  it("caps at 99 for max XP and the 200M hard cap", () => {
    expect(levelForXp(MAX_SKILL_XP)).toBe(99);
    expect(levelForXp(MAX_XP)).toBe(99);
    expect(MAX_XP).toBe(200_000_000);
  });

  it("round-trips with xpForLevel for every level", () => {
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      expect(levelForXp(xpForLevel(lvl))).toBe(lvl);
    }
  });
});

describe("computeHoursToMax", () => {
  it("a fresh level-1 account needs all 24 skills' worth of XP", () => {
    const { rows, totalRemainingXp, alreadyMaxed } = computeHoursToMax(
      progressFrom({}),
      {}
    );
    expect(alreadyMaxed).toBe(false);
    expect(totalRemainingXp).toBe(MAX_SKILL_XP * SKILL_COUNT);
    expect(rows).toHaveLength(SKILL_COUNT);
    expect(rows.every((r) => r.usedDefault)).toBe(true);
  });

  it("uses the default XP/hr when a rate is blank", () => {
    const attack = SKILLS.find((s) => s.key === "attack")!;
    const { rows } = computeHoursToMax(progressFrom({}), {});
    const row = rows.find((r) => r.key === "attack")!;
    expect(row.xpHr).toBe(attack.defaultXpHr);
    expect(row.hours).toBeCloseTo(MAX_SKILL_XP / attack.defaultXpHr, 5);
  });

  it("honours a user override XP/hr", () => {
    const { rows } = computeHoursToMax(progressFrom({}), { attack: 1_000_000 });
    const row = rows.find((r) => r.key === "attack")!;
    expect(row.usedDefault).toBe(false);
    expect(row.xpHr).toBe(1_000_000);
    expect(row.hours).toBeCloseTo(MAX_SKILL_XP / 1_000_000, 5);
  });

  it("treats a maxed skill as 0 remaining and 0 hours", () => {
    const { rows } = computeHoursToMax(progressFrom({ cooking: MAX_SKILL_XP }), {});
    const row = rows.find((r) => r.key === "cooking")!;
    expect(row.maxed).toBe(true);
    expect(row.remainingXp).toBe(0);
    expect(row.hours).toBe(0);
  });

  it("flags a fully maxed account", () => {
    const maxed: Record<string, number> = {};
    for (const s of SKILLS) maxed[s.key] = MAX_SKILL_XP;
    const { alreadyMaxed, totalHours } = computeHoursToMax(progressFrom(maxed), {});
    expect(alreadyMaxed).toBe(true);
    expect(totalHours).toBe(0);
  });

  it("ignores zero/negative override rates and falls back to default", () => {
    const { rows } = computeHoursToMax(progressFrom({}), { attack: 0 });
    const row = rows.find((r) => r.key === "attack")!;
    expect(row.usedDefault).toBe(true);
  });

  it("computes remaining XP as (max - current) for a partial level", () => {
    const currentXp = xpForLevel(80); // partway to 99
    const { rows } = computeHoursToMax(progressFrom({ magic: currentXp }), {});
    const row = rows.find((r) => r.key === "magic")!;
    expect(row.remainingXp).toBe(MAX_SKILL_XP - currentXp);
    expect(row.maxed).toBe(false);
  });

  it("clamps remaining XP to 0 past max, incl. the 200M cap boundary", () => {
    const { rows } = computeHoursToMax(progressFrom({ slayer: MAX_XP }), {});
    const row = rows.find((r) => r.key === "slayer")!;
    expect(row.currentXp).toBe(MAX_XP);
    expect(row.remainingXp).toBe(0);
    expect(row.hours).toBe(0);
    expect(row.maxed).toBe(true);
  });

  it("estimates hours as remainingXp / rate", () => {
    const currentXp = xpForLevel(90);
    const { rows } = computeHoursToMax(progressFrom({ mining: currentXp }), {
      mining: 100_000,
    });
    const row = rows.find((r) => r.key === "mining")!;
    expect(row.hours).toBeCloseTo((MAX_SKILL_XP - currentXp) / 100_000, 5);
  });

  it("totals hours and remaining XP across all skills", () => {
    const rate = 500_000;
    const rates: Record<string, number> = {};
    for (const s of SKILLS) rates[s.key] = rate;
    const { totalHours, totalRemainingXp } = computeHoursToMax(progressFrom({}), rates);
    expect(totalRemainingXp).toBe(MAX_SKILL_XP * SKILL_COUNT);
    expect(totalHours).toBeCloseTo((MAX_SKILL_XP * SKILL_COUNT) / rate, 5);
  });
});

describe("formatters", () => {
  it("formats durations into days/hours/minutes", () => {
    expect(formatDuration(0)).toBe("0h");
    expect(formatDuration(1.5)).toBe("1h 30m");
    expect(formatDuration(25)).toBe("1d 1h");
  });

  it("formats numbers with thousands separators", () => {
    expect(formatNumber(13034431)).toBe("13,034,431");
  });
});
