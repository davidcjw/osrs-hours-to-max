<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# OSRS Hours to Max — agent notes

An OSRS "hours to max" calculator. IGN → hiscores → XP/hr per skill → total hours to 99-everything.

## Layout
- `lib/skills.ts` — the 23 skills (in hiscores order: Attack, **Defence, Strength**, Hitpoints…), per-skill default XP/hr, max XP constants (`MAX_SKILL_XP = 13,034,431`), and `computeHoursToMax` / formatters. **This is the source of truth for the math.**
- `lib/hiscores.ts` — `parseHiscores(csv)` and `isValidUsername`. Pure + unit-tested.
- `app/api/hiscores/route.ts` — server-side proxy to `secure.runescape.com` (the hiscores API has no CORS). Uses `parseHiscores`.
- `app/page.tsx` — client component; the whole UI. State: `username`, `status`, `data`, `rates` (XP/hr overrides; `""` = use default). Results via `useMemo`.
- `app/globals.css` — the OSRS theme (`.rs-panel`, `.rs-button`, `.rs-parchment`, etc.). Colours in `:root`.
- `public/icons/*.png` — 23 skill sprites (filenames match `Skill.icon`). `app/fonts/*.ttf` — RuneScape typefaces via `next/font/local`.
- `public/sprites/` — decorative animated assets: `Max_cape_detail.png` (header goal cape), `Coins_10000.png` (bobbing/rising coins), `Max_cape_emote.gif` (the maxed celebration). Animations are CSS keyframes in `globals.css` (`rs-float`, `rs-cape`, `rs-coin`, `rs-pulse`, `rs-rise`), all disabled under `prefers-reduced-motion`. The emote GIF has a **non-transparent black background**, so it's wrapped in `.rs-emote-frame` (dark viewport) on purpose — color-keying it to transparency was tried and looked worse, so don't.

## Gotchas
- Hiscores order puts **Defence before Strength** — don't reorder `SKILLS` without re-checking the parser.
- Unranked skills return `-1` from the API; the parser floors them to level 1 / 0 XP.
- Pixel fonts render best near 16–18px; `image-rendering: pixelated` keeps icons crisp.

## SEO
- Metadata is centralised in `app/layout.tsx` (`metadataBase`, canonical, OpenGraph, Twitter card, robots, JSON-LD `WebApplication`). `SITE_URL` is hardcoded to `https://hourstomax.davidcjw.com` there and in `app/robots.ts` / `app/sitemap.ts` — update all three if the domain changes.
- `app/opengraph-image.tsx` generates the 1200×630 social card via `next/og` `ImageResponse` (`runtime = "nodejs"` so it can `readFileSync` the RuneScape ttf from `app/fonts/` and base64 the cape/coins sprites). `app/twitter-image.tsx` re-exports its default but must **statically re-declare** the route-segment config consts (can't re-export them).
- The `<section>` "About this OSRS max calculator" in `page.tsx` is always rendered (not gated behind a lookup) so crawlers get keyword-rich content.

## Workflow
- After any meaningful change, update `README.md` and this file.
- Add/extend tests in `test/` for new logic. Run `npm test`, `npm run lint`, `npm run build` before calling a change done.
