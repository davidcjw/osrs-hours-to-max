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
- `public/sprites/` — decorative animated assets: `Max_cape_detail.png` (header goal cape), `Coins_10000.png` (bobbing/rising coins), `Max_cape_emote.webp` (the maxed celebration). Animations are CSS keyframes in `globals.css` (`rs-float`, `rs-cape`, `rs-coin`, `rs-pulse`, `rs-rise`), all disabled under `prefers-reduced-motion`. The emote was a black-background GIF from the wiki — converted to a transparent animated WebP with `ffmpeg -vf "colorkey=0x101010:0.18:0.0,format=rgba" -c:v libwebp_anim -lossless 1` (OSRS sprites are hard-edged pixel art, so the key is clean; the leftover coloured specks are the emote's own firework particles).

## Gotchas
- Hiscores order puts **Defence before Strength** — don't reorder `SKILLS` without re-checking the parser.
- Unranked skills return `-1` from the API; the parser floors them to level 1 / 0 XP.
- Pixel fonts render best near 16–18px; `image-rendering: pixelated` keeps icons crisp.

## Workflow
- After any meaningful change, update `README.md` and this file.
- Add/extend tests in `test/` for new logic. Run `npm test`, `npm run lint`, `npm run build` before calling a change done.
