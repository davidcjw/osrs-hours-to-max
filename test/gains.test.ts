import { describe, it, expect } from "vitest";
import {
  gainsMessage,
  formatSpan,
  parseSpan,
  formatPeriod,
  formatXpShort,
} from "@/lib/gains";

describe("gainsMessage", () => {
  it("returns a rest-day message for zero or negative gains", () => {
    expect(gainsMessage(0).label).toBe("Rest Day");
    expect(gainsMessage(-100).label).toBe("Rest Day");
  });

  it("escalates the label as XP grows", () => {
    expect(gainsMessage(10_000).label).toBe("Warming Up");
    expect(gainsMessage(100_000).label).toBe("Grinding");
    expect(gainsMessage(500_000).label).toBe("Locked In");
    expect(gainsMessage(2_000_000).label).toBe("No-Lifing");
    expect(gainsMessage(10_000_000).label).toBe("Sweating");
    expect(gainsMessage(25_000_000).label).toBe("Legendary");
  });

  it("always returns a non-empty message", () => {
    for (const xp of [0, 1, 49_999, 50_000, 999_999, 1_000_000, 1e8]) {
      expect(gainsMessage(xp).message.length).toBeGreaterThan(0);
    }
  });

  it("respects tier boundaries exactly", () => {
    expect(gainsMessage(49_999).label).toBe("Warming Up");
    expect(gainsMessage(50_000).label).toBe("Grinding");
    expect(gainsMessage(249_999).label).toBe("Grinding");
    expect(gainsMessage(250_000).label).toBe("Locked In");
  });
});

describe("formatSpan / parseSpan", () => {
  it("round-trips xp and days (no skills)", () => {
    expect(parseSpan(formatSpan(1_234_567, 3))).toEqual({
      xp: 1_234_567,
      days: 3,
      topSkills: [],
    });
  });

  it("round-trips a per-skill breakdown (capped at 4)", () => {
    const skills = [
      { key: "slayer", xp: 800_000 },
      { key: "agility", xp: 300_000 },
      { key: "runecraft", xp: 120_000 },
      { key: "mining", xp: 90_000 },
      { key: "fishing", xp: 10_000 }, // 5th — should be dropped
    ];
    const span = formatSpan(2_000_000, 7, skills);
    expect(span).toBe(
      "2000000-7-slayer.800000-agility.300000-runecraft.120000-mining.90000"
    );
    expect(parseSpan(span)).toEqual({
      xp: 2_000_000,
      days: 7,
      topSkills: skills.slice(0, 4),
    });
  });

  it("skips zero/negative skill gains when encoding", () => {
    const span = formatSpan(100, 1, [
      { key: "slayer", xp: 0 },
      { key: "mining", xp: 500 },
    ]);
    expect(span).toBe("100-1-mining.500");
  });

  it("reads older skill-less links and reports no top skills", () => {
    expect(parseSpan("500000-2")).toEqual({ xp: 500_000, days: 2, topSkills: [] });
  });

  it("floors and clamps negatives when encoding", () => {
    expect(formatSpan(-5, -2)).toBe("0-0");
    expect(formatSpan(100.9, 2.9)).toBe("100-2");
  });

  it("rejects malformed segments", () => {
    expect(parseSpan("abc")).toBeNull();
    expect(parseSpan("123")).toBeNull();
    expect(parseSpan("123-")).toBeNull();
    expect(parseSpan("-3")).toBeNull();
    expect(parseSpan("1.5-3")).toBeNull();
    expect(parseSpan("12-3-4")).toBeNull();
  });

  it("rejects absurd values", () => {
    expect(parseSpan("9999999999-1")).toBeNull();
    expect(parseSpan("100-999999")).toBeNull();
  });

  it("rejects a malformed trailing skill segment", () => {
    expect(parseSpan("12-3-4")).toBeNull(); // "4" isn't "{key}.{xp}"
    expect(parseSpan("12-3-slayer")).toBeNull(); // missing ".xp"
    expect(parseSpan("12-3-slayer.")).toBeNull();
    expect(parseSpan("12-3-Slayer.5")).toBeNull(); // uppercase key
    expect(parseSpan("12-3-a.1-b.2-c.3-d.4-e.5")).toBeNull(); // > 4 skills
  });
});

describe("formatXpShort", () => {
  it("formats k / M with one decimal, trimming .0", () => {
    expect(formatXpShort(999)).toBe("999");
    expect(formatXpShort(1_000)).toBe("1k");
    expect(formatXpShort(1_500)).toBe("1.5k");
    expect(formatXpShort(99_900)).toBe("99.9k");
    expect(formatXpShort(450_000)).toBe("450k");
    expect(formatXpShort(1_234_567)).toBe("1.2M");
    expect(formatXpShort(12_345_678)).toBe("12.3M");
    expect(formatXpShort(120_000_000)).toBe("120M");
  });

  it("rolls 999,999 up to ~1M rather than 1000k", () => {
    expect(formatXpShort(999_999)).toBe("1M");
  });
});

describe("formatPeriod", () => {
  it("describes common spans", () => {
    expect(formatPeriod(0)).toBe("today");
    expect(formatPeriod(1)).toBe("in 1 day");
    expect(formatPeriod(3)).toBe("in 3 days");
    expect(formatPeriod(7)).toBe("in 1 week");
    expect(formatPeriod(21)).toBe("in 3 weeks");
    expect(formatPeriod(30)).toBe("in 1 month");
    expect(formatPeriod(90)).toBe("in 3 months");
  });
});
