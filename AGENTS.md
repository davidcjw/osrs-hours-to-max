<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# OSRS Hours to Max — agent notes

An OSRS "hours to max" calculator. IGN → hiscores → XP/hr per skill → total hours to 99-everything.

## Layout
- `lib/skills.ts` — the 24 skills (in hiscores order: Attack, **Defence, Strength**, Hitpoints… **Sailing** last), per-skill default XP/hr, a `methods: Method[]` list of named training-method presets per skill (low→high XP/hr), max XP constants (`MAX_SKILL_XP = 13,034,431`), and `computeHoursToMax` / formatters. **This is the source of truth for the math.** Method `xpHr` values must be **unique within a skill** — the UI maps the selected preset back to a rate by exact `xpHr` match, so a duplicate would shadow another (a test enforces this).
- `lib/hiscores.ts` — `fetchHiscores(name)` (validate + fetch + parse, returns a discriminated `HiscoresResult`), plus `parseHiscores` / `isValidUsername`. Pure parts unit-tested; `fetchHiscores` tested with a mocked `fetch`.
- `lib/shares.ts` — REST wrapper around the Supabase `get_counter` / `increment_counter` RPCs (no SDK). Returns `null` (→ treated as 0) when `SUPABASE_URL`/`SUPABASE_KEY` are unset, so the app degrades gracefully.
- `app/api/hiscores/route.ts` — thin wrapper over `fetchHiscores`. `app/api/share/route.ts` — GET reads / POST increments the counter.
- `app/Calculator.tsx` — the whole interactive UI (client component). State: `username`, `status`, `data`, `rates` (XP/hr overrides; `""` = use default), `shareCount`. Accepts `initialData` / `initialUsername` / `initialError` / `initialShareCount` props so it can be server-preloaded. Results via `useMemo`. Each non-maxed skill card has a **method preset `<select>`** plus the custom XP/hr number input; both write to the same `rates` state. `pickMethod` fills the rate from the chosen method; `selectedMethod` derives which option is shown (matches `rates[key]` to a method `xpHr`, else the disabled "Custom" sentinel `CUSTOM`, else "" = "Average (default)").
- `app/page.tsx` — static server component rendering `<Calculator />`.
- `app/u/[username]/page.tsx` — server-renders a preloaded `<Calculator>` with per-user `generateMetadata`; `opengraph-image.tsx` there renders the per-user social card. The hiscores lookup is wrapped in React `cache()` to dedupe across metadata + page. After a successful lookup on `/`, the client `replaceState`s to `/u/{username}` (that's the URL-state / shareable link).
- `lib/gains.ts` — daily-tracker pure helpers: `gainsMessage(xp)` (motivational tiers), `formatSpan`/`parseSpan` (the `{gainedXP}-{days}` URL segment), `formatPeriod`. Tested.
- Tracker UI lives in `Calculator.tsx`: a per-username snapshot (`htm:snap:{lowercased}`) in `localStorage` holds `{savedAt, totalXp, perSkill}`. Gains = live XP − snapshot; "Save today" re-baselines. Reading the snapshot is an external-store sync in an effect (one `eslint-disable react-hooks/set-state-in-effect`).
- `app/u/[username]/gains/[span]/` — shareable gains card. `span` is parsed by `parseSpan`; malformed → `redirect()` to the profile. The OG image there must keep **single-child text nodes** (satori needs `display:flex` for multi-child divs) — compose strings in JS, don't mix `text {expr}` in one div.
- `app/globals.css` — the OSRS theme (`.rs-panel`, `.rs-button`, `.rs-parchment`, etc.). Colours in `:root`.
- `public/icons/*.png` — 24 skill sprites (filenames match `Skill.icon`). `app/fonts/*.ttf` — RuneScape typefaces via `next/font/local`.
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
