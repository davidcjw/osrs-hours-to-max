<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# OSRS Hours to Max — agent notes

An OSRS "hours to max" calculator. IGN → hiscores → XP/hr per skill → total hours to 99-everything.

## Layout
- `lib/skills.ts` — the 24 skills (in hiscores order: Attack, **Defence, Strength**, Hitpoints… **Sailing** last), per-skill default XP/hr, a `methods: Method[]` list of named training-method presets per skill (low→high XP/hr), max XP constants (`MAX_SKILL_XP = 13,034,431`), and `computeHoursToMax` / formatters. **This is the source of truth for the math.** Method `xpHr` values must be **unique within a skill** — the UI maps the selected preset back to a rate by exact `xpHr` match, so a duplicate would shadow another (a test enforces this).
- `lib/hiscores.ts` — `fetchHiscores(name)` (validate + fetch + parse, returns a discriminated `HiscoresResult` incl. `accountType`), plus `parseHiscores` / `isValidUsername`. Pure parts unit-tested; `fetchHiscores` tested with a mocked `fetch`. **Account-type detection** (`AccountType` = normal/ironman/hardcore/ultimate): after the main lookup, `detectAccountType` checks the ironman/hardcore/ultimate boards in parallel via `isOnBoard` (200 = listed, 404 = not that type). UIM/HCIM also appear on the ironman board, so ultimate > hardcore > ironman precedence. Presence-based only — a de-ironed account lingering on the ironman board may misread as ironman (cosmetic badge, so we don't XP-compare). Any detection failure → `normal`. Adds 3 extra hiscores calls per lookup (parallel, ~1 RTT).
- `lib/shares.ts` — REST wrapper around the Supabase `get_counter` / `increment_counter` RPCs (no SDK). Returns `null` (→ treated as 0) when `SUPABASE_URL`/`SUPABASE_KEY` are unset, so the app degrades gracefully.
- `app/api/hiscores/route.ts` — thin wrapper over `fetchHiscores`. `app/api/share/route.ts` — GET reads / POST increments the counter.
- `app/Calculator.tsx` — the whole interactive UI (client component). State: `username`, `status`, `data`, `rates` (XP/hr overrides; `""` = use default), `shareCount`. Accepts `initialData` / `initialUsername` / `initialError` / `initialShareCount` props so it can be server-preloaded. Results via `useMemo`. Each non-maxed skill card has a **`<MethodSelect>`** (themed custom dropdown, `app/MethodSelect.tsx`) plus the custom XP/hr number input; both write to the same `rates` state. `pickMethod(skill, name)` fills the rate from the chosen method (`""` = back to average). `MethodSelect` derives its button label from `rate`: matches a method by `xpHr`, else shows `Custom · {n}/hr` for a hand-typed value, else "Average (default)". It's a `role="combobox"` button + `role="listbox"` popover (not a native `<select>` — those render an unstyleable white OS picker on iOS); closes on outside `pointerdown`/Escape, arrow-key + Enter navigation, options pick on `pointerdown` so they beat the outside-click handler.
- `app/page.tsx` — static server component rendering `<Calculator />`.
- Sharing (`share` / `shareGains` in `Calculator.tsx`): both first try `fetchShareImage()` to pull the relevant OG card route (`/u/{username}/opengraph-image` or `…/gains/{span}/opengraph-image`) as a PNG `File`, then `navigator.share({ ...data, files: [file] })` if `navigator.canShare({ files })` is true. Degrades to link-only `navigator.share`, then `clipboard.writeText`. Button shows "Preparing…" during the (cold-render-prone) image fetch.
- Download (`downloadCard` / `downloadGainsCard`): `downloadShareImage()` fetches the same OG route as a blob and triggers an `<a download>` — the desktop counterpart to file-share (which is mobile-only). Falls back to opening the image in a new tab if the blob download is blocked.
- Analytics: `@vercel/analytics`. `<Analytics />` is mounted in `app/layout.tsx`; custom events via `track()` in `Calculator.tsx` — `lookup` ({maxed}), `share` ({surface: grind|gains, method: files|link|clipboard}), `download_card` ({surface}). **Web Analytics must be toggled on in the Vercel project** (Analytics tab) or events/pageviews silently don't record. The `npm audit` "fix" wants to downgrade Next to v9 because of the analytics dep's peer range — do NOT run `audit fix --force`.
- `app/u/[username]/page.tsx` — server-renders a preloaded `<Calculator>` with per-user `generateMetadata`; `opengraph-image.tsx` there renders the per-user social card. The hiscores lookup is wrapped in React `cache()` to dedupe across metadata + page. After a successful lookup on `/`, the client `replaceState`s to `/u/{username}` (that's the URL-state / shareable link).
- `lib/gains.ts` — daily-tracker pure helpers: `gainsMessage(xp)` (motivational tiers), `formatSpan`/`parseSpan` (the `{gainedXP}-{days}` URL segment), `formatPeriod`. Tested.
- Tracker UI lives in `Calculator.tsx`: a per-username snapshot (`htm:snap:{lowercased}`) in `localStorage` holds `{savedAt, totalXp, perSkill}`. Gains = live XP − snapshot; "Save today" re-baselines. Reading the snapshot is an external-store sync in an effect (one `eslint-disable react-hooks/set-state-in-effect`).
- `app/u/[username]/gains/[span]/` — shareable gains card. `span` is parsed by `parseSpan`; malformed → `redirect()` to the profile. The OG image there must keep **single-child text nodes** (satori needs `display:flex` for multi-child divs) — compose strings in JS, don't mix `text {expr}` in one div.
- `app/globals.css` — the OSRS theme (`.rs-panel`, `.rs-button`, `.rs-parchment`, etc.). Colours in `:root`.
- `public/icons/*.png` — 24 skill sprites (filenames match `Skill.icon`). `app/fonts/*.ttf` — RuneScape typefaces via `next/font/local`.
- `public/sprites/` — decorative animated assets: `Max_cape_detail.png` (header goal cape), `Coins_10000.png` (bobbing/rising coins), `Max_cape_emote.gif` (the maxed celebration). Also `{Ironman,Hardcore_ironman,Ultimate_ironman}_chat_badge.png` — the tiny (10–13px) OSRS Wiki chat badges shown next to a name by account type; rendered via `AccountBadge` in `Calculator.tsx` and base64'd into both OG cards. They're scaled up ~3–4× and read as intentionally pixelated. Animations are CSS keyframes in `globals.css` (`rs-float`, `rs-cape`, `rs-coin`, `rs-pulse`, `rs-rise`), all disabled under `prefers-reduced-motion`. The emote GIF has a **non-transparent black background**, so it's wrapped in `.rs-emote-frame` (dark viewport) on purpose — color-keying it to transparency was tried and looked worse, so don't.

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
