import { describe, it, expect } from "vitest";
import {
  gainsMessage,
  formatSpan,
  parseSpan,
  formatPeriod,
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
  it("round-trips xp and days", () => {
    expect(parseSpan(formatSpan(1_234_567, 3))).toEqual({
      xp: 1_234_567,
      days: 3,
    });
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
