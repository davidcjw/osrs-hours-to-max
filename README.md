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
- 🎨 **Authentic OSRS UI** — RuneScape typeface, official skill sprites, riveted interface panels.

## How it works

- **Max** = level 99 in all 23 skills = `13,034,431` XP each (`299,791,913` total).
- The OSRS hiscores API blocks browser CORS, so lookups go through a small
  server-side proxy at `app/api/hiscores/route.ts`.
- Hours per skill = `remaining XP ÷ XP per hour`. Defaults live in `lib/skills.ts`.

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
lib/
  skills.ts               # skill data, defaults, hours-to-max math
  hiscores.ts             # hiscores CSV parser + username validation
public/icons/             # 23 skill sprites
test/                     # vitest specs
```

## Deployment

Deployed on [Vercel](https://vercel.com/). Pushing to `master` triggers an
automatic production deploy.

## Credits & legal

This is a **fan project** — not affiliated with, endorsed by, or sponsored by
Jagex. RuneScape and Old School RuneScape are trademarks of Jagex Ltd. Skill
sprites are from the [OSRS Wiki](https://oldschool.runescape.wiki/); the
RuneScape fonts are from [RuneStar/fonts](https://github.com/RuneStar/fonts).
Stats are read from the official OSRS hiscores. Provided free, for fun.
