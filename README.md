# OSRS Hours to Max ⏳

An Old School RuneScape **"hours to max"** calculator. Enter your username, pull
your live stats from the official OSRS hiscores, set your XP/hr per skill (or use
sensible community averages), and see exactly how many hours stand between you and
a maxed account.

Built to look and feel like the in-game interface — real RuneScape fonts, skill
icons, stone panels and a parchment scroll for the result.

## Features

- 🔎 **Live hiscores lookup** — type an IGN, get current level + XP for all 23 skills.
- ⚙️ **Per-skill XP/hr** — override any skill's rate; blanks fall back to a reasonable average.
- ⏱️ **Instant totals** — total hours to max, an `Xd Yh` breakdown, and per-skill estimates that update as you type.
- 🟢 **Maxed detection** — already-99 skills are marked done; a fully maxed account gets a little celebration.
- 🔗 **Shareable result pages** — every lookup gets a clean `/u/{username}` URL with a per-user social preview card (e.g. "Faux — 1,356 hours to max"), so friends see your grind when you share it.
- ⚔️ **Live share counter** — "N scapers have shared their grind", backed by Supabase.
- 🎨 **Authentic OSRS UI** — RuneScape typeface, official skill sprites, riveted interface panels.
- ✨ **Animated sprites** — a floating Max cape goal, bobbing coins, pulsing maxed-skill icons, and the in-game Max cape emote (with rising-coin confetti) when you've maxed.

## How it works

- **Max** = level 99 in all 23 skills = `13,034,431` XP each (`299,791,913` total).
- The OSRS hiscores API blocks browser CORS, so lookups go through a small
  server-side proxy at `app/api/hiscores/route.ts`.
- Hours per skill = `remaining XP ÷ XP per hour`. Defaults live in `lib/skills.ts`.

## SEO

- Full metadata in `app/layout.tsx`: `metadataBase`, canonical URL, OpenGraph + Twitter `summary_large_image` cards, robots directives, and `WebApplication` JSON-LD.
- A branded 1200×630 social preview image generated at `app/opengraph-image.tsx` (RuneScape font + Max cape).
- `app/robots.ts` and `app/sitemap.ts` for crawlers; an always-visible "About" section for crawlable, keyword-rich content.

## Tech stack

- [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- React 19 + TypeScript
- Tailwind CSS v4
- [Vitest](https://vitest.dev/) for the calculation/parsing logic

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
```

Other scripts:

```bash
npm run build    # production build
npm run lint     # eslint
npm test         # vitest (logic + hiscores parsing)
```

## Project structure

```
app/
  api/hiscores/route.ts   # server-side hiscores proxy
  page.tsx                # the calculator UI (client component)
  layout.tsx              # fonts + metadata
  globals.css             # OSRS theme
  fonts/                  # RuneScape typefaces (self-hosted via next/font)
  Calculator.tsx          # the interactive calculator (client component)
  u/[username]/           # shareable per-user page + dynamic OG image
  api/share/route.ts      # share counter (GET reads, POST increments)
lib/
  skills.ts               # skill data, defaults, hours-to-max math
  hiscores.ts             # hiscores fetch + CSV parser + username validation
  shares.ts               # Supabase counter RPC wrapper
public/icons/             # 23 skill sprites
test/                     # vitest specs
```

## Environment variables

The share counter needs a Supabase project with `app_counters` + the
`increment_counter` / `get_counter` RPCs. Set:

```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_KEY=<publishable or anon key>
```

If these are unset, the app still works — the counter just reads as 0.

## Deployment

Live at **[hourstomax.davidcjw.com](https://hourstomax.davidcjw.com)**, deployed
on [Vercel](https://vercel.com/). Pushing to `master` triggers an automatic
production deploy.

## Credits & legal

This is a **fan project** — not affiliated with, endorsed by, or sponsored by
Jagex. RuneScape and Old School RuneScape are trademarks of Jagex Ltd. Skill
sprites and item/emote graphics (`public/icons`, `public/sprites`) are from the
[OSRS Wiki](https://oldschool.runescape.wiki/); the RuneScape fonts are from
[RuneStar/fonts](https://github.com/RuneStar/fonts).
Stats are read from the official OSRS hiscores. Provided free, for fun.
