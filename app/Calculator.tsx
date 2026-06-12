"use client";

import { useEffect, useMemo, useState } from "react";
import {
  SKILLS,
  computeHoursToMax,
  formatDuration,
  formatNumber,
  MAX_SKILL_XP,
  type Skill,
  type SkillProgress,
} from "@/lib/skills";
import { formatSpan, formatPeriod, gainsMessage } from "@/lib/gains";

interface Snapshot {
  savedAt: string; // ISO timestamp
  totalXp: number;
  perSkill: Record<string, number>;
}

const snapKey = (username: string) =>
  `htm:snap:${username.trim().toLowerCase()}`;

// Sentinel for the (disabled) "Custom" option shown when the entered XP/hr
// doesn't match any preset method.
const CUSTOM = "__custom__";

/** Which method dropdown option reflects the current rate. */
function selectedMethod(skill: Skill, rate: number | ""): string {
  if (rate === "") return ""; // blank => "Average (default)"
  const match = skill.methods.find((m) => m.xpHr === rate);
  return match ? match.name : CUSTOM;
}

function sumXp(progress: Record<string, SkillProgress>): number {
  return SKILLS.reduce((sum, s) => sum + (progress[s.key]?.xp ?? 0), 0);
}

function daysBetween(fromIso: string): number {
  const then = new Date(fromIso).getTime();
  if (!Number.isFinite(then)) return 0;
  return Math.max(0, Math.floor((Date.now() - then) / 86_400_000));
}

export interface HiscoresData {
  username: string;
  totalLevel: number;
  progress: Record<string, SkillProgress>;
}

interface CalculatorProps {
  /** Preloaded hiscores (from the server on /u/[username]). */
  initialData?: HiscoresData | null;
  /** Prefill the username field (e.g. a shared name that wasn't found). */
  initialUsername?: string;
  /** Error to show on first render (e.g. shared name not found). */
  initialError?: string | null;
  /** Share count rendered on the server to avoid a flash. */
  initialShareCount?: number | null;
}

export default function Calculator({
  initialData = null,
  initialUsername = "",
  initialError = null,
  initialShareCount = null,
}: CalculatorProps) {
  const [username, setUsername] = useState(
    initialData?.username ?? initialUsername
  );
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "loaded">(
    initialData ? "loaded" : initialError ? "error" : "idle"
  );
  const [error, setError] = useState<string | null>(initialError);
  const [data, setData] = useState<HiscoresData | null>(initialData);
  // user-entered XP/hr overrides keyed by skill key ("" = use default)
  const [rates, setRates] = useState<Record<string, number | "">>({});

  const [shareCount, setShareCount] = useState<number | null>(initialShareCount);
  const [shareLabel, setShareLabel] = useState("Share my grind");

  // Daily progress tracker (localStorage-backed, per username).
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [gainsLabel, setGainsLabel] = useState("Share gains");

  async function lookup(name: string) {
    const n = name.trim();
    if (!n) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/api/hiscores?username=${encodeURIComponent(n)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setData(json as HiscoresData);
      setStatus("loaded");
      // Reflect the shareable URL in the address bar without a reload.
      if (typeof window !== "undefined") {
        window.history.replaceState(
          null,
          "",
          `/u/${encodeURIComponent((json as HiscoresData).username)}`
        );
      }
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  // Fetch the live share count on mount.
  useEffect(() => {
    let active = true;
    fetch("/api/share")
      .then((r) => r.json())
      .then((j) => {
        if (active && typeof j.count === "number") setShareCount(j.count);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Load this account's saved snapshot from localStorage when the loaded
  // account changes (an external-store read, so it can't be derived state).
  useEffect(() => {
    if (!data) return;
    let snap: Snapshot | null = null;
    try {
      const raw = localStorage.getItem(snapKey(data.username));
      if (raw) snap = JSON.parse(raw) as Snapshot;
    } catch {
      snap = null;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSnapshot(snap);
  }, [data]);

  const result = useMemo(() => {
    if (!data) return null;
    return computeHoursToMax(data.progress, rates);
  }, [data, rates]);

  // Gains since the saved snapshot (current live XP minus the baseline).
  const gains = useMemo(() => {
    if (!data || !snapshot) return null;
    const currentTotal = sumXp(data.progress);
    const gainedXp = currentTotal - snapshot.totalXp;
    const days = daysBetween(snapshot.savedAt);
    const perSkill = SKILLS.map((s) => ({
      key: s.key,
      name: s.name,
      icon: s.icon,
      gained: (data.progress[s.key]?.xp ?? 0) - (snapshot.perSkill[s.key] ?? 0),
    }))
      .filter((s) => s.gained > 0)
      .sort((a, b) => b.gained - a.gained);
    return { gainedXp, days, topSkills: perSkill.slice(0, 3) };
  }, [data, snapshot]);

  function saveSnapshot() {
    if (!data) return;
    const snap: Snapshot = {
      savedAt: new Date().toISOString(),
      totalXp: sumXp(data.progress),
      perSkill: Object.fromEntries(
        SKILLS.map((s) => [s.key, data.progress[s.key]?.xp ?? 0])
      ),
    };
    try {
      localStorage.setItem(snapKey(data.username), JSON.stringify(snap));
      setSnapshot(snap);
    } catch {
      // localStorage unavailable (private mode) — nothing else to do
    }
  }

  async function shareGains() {
    if (!data || !gains || gains.gainedXp <= 0) return;
    const url = `${window.location.origin}/u/${encodeURIComponent(
      data.username
    )}/gains/${formatSpan(gains.gainedXp, gains.days)}`;
    const text = `${data.username} gained ${formatNumber(
      gains.gainedXp
    )} XP ${formatPeriod(gains.days)} in OSRS. ${gainsMessage(gains.gainedXp).message}`;
    let shared = false;
    try {
      if (navigator.share) {
        await navigator.share({ title: "OSRS Hours to Max", text, url });
        shared = true;
      } else {
        await navigator.clipboard.writeText(url);
        setGainsLabel("Link copied!");
        shared = true;
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setGainsLabel("Link copied!");
        shared = true;
      } catch {
        setGainsLabel("Copy failed");
      }
    }
    if (shared) {
      try {
        const res = await fetch("/api/share", { method: "POST" });
        const j = await res.json();
        if (typeof j.count === "number") setShareCount(j.count);
      } catch {
        // best-effort
      }
    }
    setTimeout(() => setGainsLabel("Share gains"), 2500);
  }

  function setRate(key: string, value: string) {
    setRates((prev) => {
      const next = { ...prev };
      if (value === "") next[key] = "";
      else {
        const n = Math.max(0, Math.floor(Number(value)));
        next[key] = Number.isFinite(n) ? n : "";
      }
      return next;
    });
  }

  // Picking a method preset fills that skill's XP/hr; "" resets to the average.
  function pickMethod(skill: Skill, methodName: string) {
    if (methodName === "" || methodName === CUSTOM) {
      setRate(skill.key, "");
      return;
    }
    const method = skill.methods.find((m) => m.name === methodName);
    if (method) setRate(skill.key, String(method.xpHr));
  }

  async function share() {
    if (!data) return;
    const url = `${window.location.origin}/u/${encodeURIComponent(
      data.username
    )}`;
    const shareData = {
      title: "OSRS Hours to Max",
      text: result?.alreadyMaxed
        ? `${data.username} is MAXED on Old School RuneScape!`
        : `${data.username} needs ${formatNumber(
            result?.totalHours ?? 0
          )} hours to max in OSRS. How long is your grind?`,
      url,
    };
    let shared = false;
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        shared = true;
      } else {
        await navigator.clipboard.writeText(url);
        setShareLabel("Link copied!");
        shared = true;
      }
    } catch {
      // user cancelled native share, or clipboard blocked — try clipboard
      try {
        await navigator.clipboard.writeText(url);
        setShareLabel("Link copied!");
        shared = true;
      } catch {
        setShareLabel("Copy failed");
      }
    }
    if (shared) {
      try {
        const res = await fetch("/api/share", { method: "POST" });
        const j = await res.json();
        if (typeof j.count === "number") setShareCount(j.count);
      } catch {
        // counter is best-effort
      }
    }
    setTimeout(() => setShareLabel("Share my grind"), 2500);
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-3 py-6 sm:px-6 sm:py-10">
      {/* Header */}
      <header className="mb-6 flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sprites/Max_cape_detail.png"
          alt="Max cape"
          className="rs-cape mb-1 h-16 w-auto sm:h-20"
        />
        <div className="flex items-center justify-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sprites/Coins_10000.png"
            alt=""
            aria-hidden="true"
            className="rs-coin h-7 w-7"
          />
          <h1 className="rs-title text-3xl leading-tight sm:text-5xl">
            Hours&nbsp;to&nbsp;Max
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/sprites/Coins_10000.png"
            alt=""
            aria-hidden="true"
            className="rs-coin rs-coin--delay h-7 w-7"
          />
        </div>
        <p className="rs-shadow mt-2 text-base sm:text-lg text-[var(--rs-text-dim)]">
          Old School RuneScape — how long until 99 in everything?
        </p>
      </header>

      {/* Lookup bar */}
      <section className="rs-panel mb-6 p-4 sm:p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            lookup(username);
          }}
          className="flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <label htmlFor="ign" className="rs-heading shrink-0 text-base sm:text-lg">
            Enter your username:
          </label>
          <input
            id="ign"
            className="rs-input flex-1 px-3 py-2 text-base sm:text-lg"
            type="text"
            inputMode="text"
            maxLength={12}
            placeholder="e.g. Zezima"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <button
            type="submit"
            className="rs-button px-5 py-2 text-base sm:text-lg"
            disabled={status === "loading" || !username.trim()}
          >
            {status === "loading" ? "Loading…" : "Look up"}
          </button>
        </form>
        {status === "error" && (
          <p className="rs-shadow mt-3 text-base" style={{ color: "var(--rs-red)" }}>
            {error}
          </p>
        )}
        {status === "idle" && (
          <p className="rs-shadow mt-3 text-sm text-[var(--rs-text-dim)]">
            We pull your live stats from the OSRS hiscores, then estimate your
            time to max. Leave a skill&apos;s XP/hr blank to use a sensible
            average.
          </p>
        )}
      </section>

      {/* Result + skills */}
      {status === "loaded" && data && result && (
        <>
          {/* The grand total scroll */}
          <section className="rs-parchment relative mb-6 overflow-hidden p-5 text-center sm:p-7">
            {result.alreadyMaxed ? (
              <>
                {/* rising coins celebration */}
                {[12, 32, 50, 68, 86].map((left, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={left}
                    src="/sprites/Coins_10000.png"
                    alt=""
                    aria-hidden="true"
                    className="rs-rise-coin"
                    style={{ left: `${left}%`, animationDelay: `${i * 0.45}s` }}
                  />
                ))}
                {/* The emote GIF has a solid black background, so frame it as
                    an in-game "viewport" where the black reads as intentional. */}
                <div className="rs-emote-frame relative mx-auto mb-3 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/sprites/Max_cape_emote.gif"
                    alt={`${data.username} performing the Max cape emote`}
                    className="h-40 w-auto sm:h-52"
                  />
                </div>
                <h2
                  className="rs-shadow text-2xl font-bold sm:text-3xl"
                  style={{ fontFamily: "var(--font-rs-bold)" }}
                >
                  {data.username} is MAXED! 🏆
                </h2>
                <p className="rs-shadow mt-2 text-lg">
                  All 24 skills at 99. Nothing left to grind. Go outside.
                </p>
              </>
            ) : (
              <>
                <p className="rs-shadow text-base uppercase tracking-wider">
                  {data.username} &middot; Total level {formatNumber(data.totalLevel)}
                </p>
                <h2
                  className="rs-shadow mt-1 text-3xl sm:text-5xl font-bold"
                  style={{ fontFamily: "var(--font-rs-bold)" }}
                >
                  {formatNumber(result.totalHours)} hours to max
                </h2>
                <p className="rs-shadow mt-2 text-lg sm:text-xl">
                  ≈ {formatDuration(result.totalHours)} of play
                </p>
                <p className="rs-shadow mt-2 text-base">
                  {formatNumber(result.totalRemainingXp)} XP remaining across{" "}
                  {result.rows.filter((r) => !r.maxed).length} skills
                </p>
              </>
            )}
          </section>

          {/* Share bar */}
          <div className="mb-6 flex flex-col items-center gap-2">
            <button
              type="button"
              onClick={share}
              className="rs-button px-6 py-2 text-base sm:text-lg"
            >
              {shareLabel} ⚔
            </button>
            <p className="rs-shadow text-sm text-[var(--rs-text-dim)]">
              {!shareCount || shareCount <= 0
                ? "Be the first scaper to share your grind ⚔"
                : shareCount === 1
                  ? "⚔ 1 scaper has shared their grind"
                  : `⚔ ${formatNumber(shareCount)} scapers have shared their grind`}
            </p>
          </div>

          {/* Daily gains tracker */}
          <section className="rs-panel mb-6 p-4 sm:p-5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="rs-heading text-lg sm:text-xl">Gains tracker</h3>
              {snapshot && (
                <button
                  type="button"
                  onClick={saveSnapshot}
                  className="rs-button px-3 py-1 text-sm"
                  title="Reset the baseline to today's XP"
                >
                  Save today
                </button>
              )}
            </div>

            {!snapshot ? (
              <div className="flex flex-col items-start gap-3">
                <p className="rs-shadow text-sm text-[var(--rs-text-dim)]">
                  Save a snapshot of {data.username}&apos;s XP today, then come
                  back another day to see exactly how much you&apos;ve gained —
                  and share a card to flex your grind. Saved on this device only.
                </p>
                <button
                  type="button"
                  onClick={saveSnapshot}
                  className="rs-button px-5 py-2 text-base"
                >
                  Save today&apos;s snapshot ⚔
                </button>
              </div>
            ) : (
              <div>
                <p className="rs-shadow text-sm text-[var(--rs-text-dim)]">
                  Tracking since{" "}
                  {new Date(snapshot.savedAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}{" "}
                  &middot; {formatPeriod(gains?.days ?? 0)}
                </p>

                {gains && gains.gainedXp > 0 ? (
                  <>
                    <div
                      className="rs-heading mt-2 text-3xl sm:text-4xl"
                      style={{ color: "var(--rs-green)" }}
                    >
                      +{formatNumber(gains.gainedXp)} XP
                    </div>
                    <p className="rs-shadow mt-1 text-sm sm:text-base">
                      <span className="text-[var(--rs-orange)]">
                        {gainsMessage(gains.gainedXp).label}:
                      </span>{" "}
                      {gainsMessage(gains.gainedXp).message}
                    </p>

                    {gains.topSkills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-3">
                        {gains.topSkills.map((s) => (
                          <div
                            key={s.key}
                            className="rs-skill flex items-center gap-2 px-2 py-1"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/icons/${s.icon}`}
                              alt={s.name}
                              width={20}
                              height={20}
                              className="rs-icon shrink-0"
                            />
                            <span
                              className="rs-shadow text-sm"
                              style={{ color: "var(--rs-green)" }}
                            >
                              +{formatNumber(s.gained)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={shareGains}
                        className="rs-button px-5 py-2 text-base"
                      >
                        {gainsLabel} 📜
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="rs-shadow mt-2 text-sm sm:text-base">
                    No new XP since your last snapshot — get grinding, then check
                    back to share your gains! ⚔
                  </p>
                )}
              </div>
            )}
          </section>

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="rs-heading text-lg sm:text-xl">Your skills</h3>
            <button
              type="button"
              onClick={() => setRates({})}
              className="rs-button px-3 py-1 text-sm"
            >
              Reset XP/hr
            </button>
          </div>

          {/* Skills grid */}
          <section className="rs-panel p-3 sm:p-4">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {result.rows.map((row) => {
                const skill = SKILLS.find((s) => s.key === row.key)!;
                return (
                  <div
                    key={row.key}
                    className={`rs-skill flex items-center gap-3 p-2 ${
                      row.maxed ? "rs-skill--maxed" : ""
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/icons/${skill.icon}`}
                      alt={skill.name}
                      width={25}
                      height={25}
                      className="rs-icon shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="rs-shadow truncate text-base">
                          {skill.name}
                        </span>
                        <span
                          className="rs-shadow shrink-0 text-base"
                          style={{
                            color: row.maxed
                              ? "var(--rs-green)"
                              : "var(--rs-yellow)",
                          }}
                        >
                          {row.level}
                          <span className="text-[var(--rs-text-dim)]">/99</span>
                        </span>
                      </div>

                      {row.maxed ? (
                        <div
                          className="rs-shadow mt-1 text-sm"
                          style={{ color: "var(--rs-green)" }}
                        >
                          Maxed ✓
                        </div>
                      ) : (
                        <div className="mt-1 flex flex-col gap-1.5">
                          <select
                            className="rs-input w-full px-2 py-1 text-sm"
                            value={selectedMethod(skill, rates[row.key] ?? "")}
                            onChange={(e) => pickMethod(skill, e.target.value)}
                            aria-label={`${skill.name} training method`}
                          >
                            <option value="">Average (default)</option>
                            {skill.methods.map((m) => (
                              <option key={m.name} value={m.name}>
                                {m.name} · {formatNumber(m.xpHr)}/hr
                              </option>
                            ))}
                            <option value={CUSTOM} disabled>
                              Custom
                            </option>
                          </select>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              className="rs-input w-24 px-2 py-1 text-sm"
                              placeholder={formatNumber(skill.defaultXpHr)}
                              value={rates[row.key] ?? ""}
                              onChange={(e) => setRate(row.key, e.target.value)}
                              aria-label={`${skill.name} XP per hour`}
                            />
                            <span className="rs-shadow text-xs text-[var(--rs-text-dim)]">
                              xp/hr{row.usedDefault ? " (avg)" : ""}
                            </span>
                            <span
                              className="rs-shadow ml-auto shrink-0 text-sm"
                              title={`${formatNumber(row.remainingXp)} XP left`}
                            >
                              {formatDuration(row.hours)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <p className="rs-shadow mt-4 text-center text-sm text-[var(--rs-text-dim)]">
            Max = level 99 in all 24 skills ({formatNumber(MAX_SKILL_XP)} XP each).
            Blank fields use community-average XP/hr.
          </p>
        </>
      )}

      {/* Always-rendered content (crawlable even before a lookup) */}
      <section className="rs-panel mt-10 p-4 sm:p-5">
        <h2 className="rs-heading mb-2 text-lg sm:text-xl">
          About this OSRS max calculator
        </h2>
        <div className="rs-shadow space-y-2 text-sm leading-relaxed text-[var(--rs-text-dim)]">
          <p>
            <strong className="text-[var(--rs-text)]">Hours to Max</strong> is a
            free Old School RuneScape time-to-max calculator. Enter your
            username, and it pulls your live stats from the official OSRS
            hiscores, then works out how many hours of play stand between you and
            a maxed account — level 99 in all 24 skills.
          </p>
          <p>
            Set a realistic{" "}
            <strong className="text-[var(--rs-text)]">XP per hour</strong> for
            each skill, or leave it blank to use a sensible community average. As
            you adjust your rates, the total updates instantly so you can plan
            your route to max cape. Maxing every skill takes{" "}
            {formatNumber(MAX_SKILL_XP)} XP per skill — over 312 million XP in
            total.
          </p>
          <p>
            Whether you&apos;re grinding Slayer, chasing 99 Agility, or finishing
            off your last few skills, this tool gives you a clear, no-nonsense
            estimate of your remaining playtime.
          </p>
        </div>
      </section>

      {/* Footer / fan disclaimer */}
      <footer className="rs-shadow mt-10 text-center text-xs text-[var(--rs-text-dim)]">
        <p>
          Fan project — not affiliated with or endorsed by Jagex. RuneScape is a
          trademark of Jagex Ltd. Stats from the official OSRS hiscores.
        </p>
      </footer>
    </main>
  );
}
