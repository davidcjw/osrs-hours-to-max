"use client";

import { useMemo, useState } from "react";
import {
  SKILLS,
  computeHoursToMax,
  formatDuration,
  formatNumber,
  MAX_SKILL_XP,
  type SkillProgress,
} from "@/lib/skills";

interface HiscoresData {
  username: string;
  totalLevel: number;
  progress: Record<string, SkillProgress>;
}

export default function Home() {
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "loaded">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<HiscoresData | null>(null);
  // user-entered XP/hr overrides keyed by skill key ("" = use default)
  const [rates, setRates] = useState<Record<string, number | "">>({});

  async function lookup(e?: React.FormEvent) {
    e?.preventDefault();
    const name = username.trim();
    if (!name) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch(`/api/hiscores?username=${encodeURIComponent(name)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong.");
        setStatus("error");
        return;
      }
      setData(json as HiscoresData);
      setStatus("loaded");
    } catch {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  const result = useMemo(() => {
    if (!data) return null;
    return computeHoursToMax(data.progress, rates);
  }, [data, rates]);

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

  function resetRates() {
    setRates({});
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
          onSubmit={lookup}
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
                  All 23 skills at 99. Nothing left to grind. Go outside.
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

          {/* Controls */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="rs-heading text-lg sm:text-xl">Your skills</h3>
            <button
              type="button"
              onClick={resetRates}
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
                        <div className="mt-1 flex items-center gap-2">
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
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <p className="rs-shadow mt-4 text-center text-sm text-[var(--rs-text-dim)]">
            Max = level 99 in all 23 skills ({formatNumber(MAX_SKILL_XP)} XP each).
            Blank fields use community-average XP/hr.
          </p>
        </>
      )}

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
