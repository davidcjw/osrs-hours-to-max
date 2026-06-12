import { describe, it, expect, vi, afterEach } from "vitest";
import { isValidUsername, parseHiscores, fetchHiscores } from "@/lib/hiscores";
import { SKILL_COUNT } from "@/lib/skills";

// A realistic index_lite body: Overall, then 24 skills (rank,level,xp),
// then a couple of activity rows that should be ignored.
function sampleBody(): string {
  const lines: string[] = [];
  lines.push("100000,1818,250000000"); // Overall
  // 24 skill rows. Make Attack unranked (-1) and Cooking maxed.
  const skillRows: [number, number, number][] = [
    [-1, -1, -1], // attack (unranked)
    [50000, 80, 2000000], // defence
    [40000, 85, 3500000], // strength
    [30000, 90, 5500000], // hitpoints
    [20000, 92, 6500000], // ranged
    [10000, 70, 750000], // prayer
    [9000, 88, 4500000], // magic
    [8000, 99, 13034431], // cooking (maxed)
    [7000, 60, 300000], // woodcutting
    [6000, 75, 1200000], // fletching
    [5000, 65, 450000], // fishing
    [4000, 80, 2000000], // firemaking
    [3000, 70, 750000], // crafting
    [2000, 72, 900000], // smithing
    [1000, 68, 600000], // mining
    [900, 78, 1600000], // herblore
    [800, 60, 300000], // agility
    [700, 82, 2500000], // thieving
    [600, 85, 3500000], // slayer
    [500, 88, 4500000], // farming
    [400, 55, 175000], // runecraft
    [300, 70, 750000], // hunter
    [200, 75, 1200000], // construction
    [150, 40, 200000], // sailing
  ];
  for (const [rank, level, xp] of skillRows) lines.push(`${rank},${level},${xp}`);
  // trailing activity/boss rows (rank,score) — should be ignored
  lines.push("12345,50");
  lines.push("-1,-1");
  return lines.join("\n");
}

describe("isValidUsername", () => {
  it("accepts normal names", () => {
    expect(isValidUsername("Zezima")).toBe(true);
    expect(isValidUsername("a b_c-1")).toBe(true);
    expect(isValidUsername("123456789012")).toBe(true); // 12 chars
  });

  it("rejects empty, too long, or illegal characters", () => {
    expect(isValidUsername("")).toBe(false);
    expect(isValidUsername("1234567890123")).toBe(false); // 13 chars
    expect(isValidUsername("bad/name")).toBe(false);
    expect(isValidUsername("inject;rm")).toBe(false);
  });
});

describe("parseHiscores", () => {
  it("parses all 24 skills and the overall total level", () => {
    const parsed = parseHiscores(sampleBody());
    expect(Object.keys(parsed.progress)).toHaveLength(SKILL_COUNT);
    expect(parsed.totalLevel).toBe(1818);
  });

  it("parses Sailing (the 24th skill, appended after Construction)", () => {
    const parsed = parseHiscores(sampleBody());
    expect(parsed.progress.sailing).toEqual({
      key: "sailing",
      level: 40,
      xp: 200000,
    });
  });

  it("floors unranked (-1) skills to level 1 / 0 xp", () => {
    const parsed = parseHiscores(sampleBody());
    expect(parsed.progress.attack).toEqual({ key: "attack", level: 1, xp: 0 });
  });

  it("reads maxed skills correctly", () => {
    const parsed = parseHiscores(sampleBody());
    expect(parsed.progress.cooking.xp).toBe(13034431);
    expect(parsed.progress.cooking.level).toBe(99);
  });

  it("maps rows in hiscores order (defence before strength)", () => {
    const parsed = parseHiscores(sampleBody());
    expect(parsed.progress.defence.xp).toBe(2000000);
    expect(parsed.progress.strength.xp).toBe(3500000);
  });

  it("throws on a truncated body", () => {
    expect(() => parseHiscores("1,2,3\n4,5,6")).toThrow();
  });
});

// sampleBody()'s Overall row is "100000,1818,250000000" → main XP 250,000,000.
const MAIN_XP = 250_000_000;

// Mock the four hiscores boards by URL. The main board returns the sample body;
// each variant returns a body with the given overall XP, or 404 when null/omitted.
// Account-type detection compares XP across boards, so a live Ironman/HCIM/UIM
// must match MAIN_XP; a frozen (dead/de-ironed) board sits behind it.
function mockBoards(xp: {
  ironman?: number | null;
  hardcore?: number | null;
  ultimate?: number | null;
}) {
  const board = (v?: number | null) =>
    v == null
      ? new Response("", { status: 404 })
      : new Response(`1,2000,${v}`, { status: 200 });
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("hiscore_oldschool_ultimate")) return board(xp.ultimate);
    if (url.includes("hiscore_oldschool_hardcore_ironman"))
      return board(xp.hardcore);
    if (url.includes("hiscore_oldschool_ironman")) return board(xp.ironman);
    return new Response(sampleBody(), { status: 200 }); // main board
  });
}

describe("fetchHiscores", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects empty and invalid usernames without hitting the network", async () => {
    const spy = vi.spyOn(globalThis, "fetch");
    expect(await fetchHiscores("")).toMatchObject({ ok: false, status: 400 });
    expect(await fetchHiscores("bad/name")).toMatchObject({ ok: false, status: 400 });
    expect(spy).not.toHaveBeenCalled();
  });

  it("returns ok with parsed progress on a successful response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(sampleBody(), { status: 200 })
    );
    const res = await fetchHiscores("Zezima");
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.username).toBe("Zezima");
      expect(res.totalLevel).toBe(1818);
      expect(res.progress.cooking.xp).toBe(13034431);
    }
  });

  it("maps a 404 to a not-found result", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 404 })
    );
    expect(await fetchHiscores("nope")).toMatchObject({ ok: false, status: 404 });
  });

  it("maps a network failure to a 502 result", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new Error("network down"));
    expect(await fetchHiscores("Zezima")).toMatchObject({ ok: false, status: 502 });
  });

  it("detects a normal account (not on the Ironman board)", async () => {
    mockBoards({ ironman: null });
    const res = await fetchHiscores("Zezima");
    expect(res).toMatchObject({ ok: true, accountType: "normal" });
  });

  it("detects an Ironman (on ironman board, in sync with main)", async () => {
    mockBoards({ ironman: MAIN_XP });
    const res = await fetchHiscores("SomeIron");
    expect(res).toMatchObject({ ok: true, accountType: "ironman" });
  });

  it("detects a live Hardcore Ironman (hardcore keeps pace with ironman)", async () => {
    mockBoards({ ironman: MAIN_XP, hardcore: MAIN_XP });
    const res = await fetchHiscores("HCIM");
    expect(res).toMatchObject({ ok: true, accountType: "hardcore" });
  });

  it("treats a DEAD Hardcore Ironman as a regular Ironman (ironman XP pulled ahead)", async () => {
    // Frozen on the hardcore board at 100M, but climbed to 250M as an iron.
    mockBoards({ ironman: MAIN_XP, hardcore: 100_000_000 });
    const res = await fetchHiscores("DeadHCIM");
    expect(res).toMatchObject({ ok: true, accountType: "ironman" });
  });

  it("detects an Ultimate Ironman (ultimate in sync with ironman)", async () => {
    mockBoards({ ironman: MAIN_XP, ultimate: MAIN_XP });
    const res = await fetchHiscores("UIM");
    expect(res).toMatchObject({ ok: true, accountType: "ultimate" });
  });

  it("treats a de-ironed account as normal (main XP pulled ahead of the frozen ironman board)", async () => {
    mockBoards({ ironman: 100_000_000 }); // main is 250M
    const res = await fetchHiscores("DeIroned");
    expect(res).toMatchObject({ ok: true, accountType: "normal" });
  });

  it("falls back to normal if account-type detection throws", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).includes("hiscore_oldschool/")) {
        return new Response(sampleBody(), { status: 200 }); // main succeeds
      }
      throw new Error("variant board down");
    });
    const res = await fetchHiscores("Zezima");
    expect(res).toMatchObject({ ok: true, accountType: "normal" });
  });
});
