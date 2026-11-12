# WIRE TO WIRE — 1999 TRACK MEET PROGRAM / SITE WIRING
2026-11-12 · Game production overlay · DOES NOT REPLACE canonical 1999 track or stakes registries

## Mission delivered
- 134 canonical ID-preserving track schedules, surfaces, race-day patterns, source tags, and status.
- 93 previously source-linked stakes retained by their exact IDs, dates, tracks, grades, distances, surfaces, and purses; 124 distinct additional ungraded WTW-only feature events are game-modeled for otherwise unserved courses; no race results or official grades are invented.
- Verified that every linked stakes date falls inside its host course's modeled or verified 1999 meet.
- All 16 historically shuttered North American tracks are revived, OPEN, with two explicit alternate-history meets, race-day patterns, and feature stakes each.
- 8 game expansion venues receive explicit fictional game schedules, not falsely presented as real.
- 16 international venues receive explicitly provisional game schedules, not fake official 1999 fixture lists.
- 1999 source generator and browser mirror use same operative meet/surface rule; no random off-meet cards.
- Same approved Office / next interface, no markup or visual/layout changes.

## Provenance boundaries
21 track meet date windows derived from actual 1999 state racing commission records:
- **California**: California Horse Racing Board 1999 Report — https://www.chrb.ca.gov/DocumentRequestor2.aspx?Category=REPORTS&DocumentID=40719&SubCategory=ANNUAL . For California county fairs the full event date span is grounded but exact thoroughbred-only daily cards remain game-modeled except clearly stated days.
- **New Jersey**: State Racing Commission 1999 Annual Report — https://www.nj.gov/oag/racing/downloads/ar1999.pdf . Monmouth reported 72 racing days, Meadowlands 51, Garden State 38, Atlantic City 5. Specific exception days modeled.
- **Illinois**: 1998 Illinois Racing Board report schedules allocated for 1999 — https://irb.illinois.gov/content/dam/soi/en/web/irb/sierra/about-the-irb/documents/annual-reports/1998-Annual-Report.pdf . Sportsman's Park 95 scheduled days, Hawthorne 108, Fairmount 101.
4 already-approved WTW game-calendar anchor meets are preserved: Belmont, Saratoga, Churchill, Keeneland.
Remaining North American and all 16 international courses have GAME_MODELED calendars as test inputs, **not certified 1999 historical dates**. All 118 North American canonical tracks are OPEN in the WTW 1999 alternate universe; 16 historical closures in real history do not apply. Never relabel approximations as historical fact.

## Source of truth
Track identities: WTW canon in `public/data/track-geography-v33.json` + existing 1999 world.
Stakes identities and dates: source-locked 93 in `src/1999/opening-world.v1.mjs` and browser canon mirror.
Site operating projection: `public/next/1999-track-program.mjs`, keyed by immutable Track_ID, with `basis` on every row.
Site wiring: `public/next/1999-ui-source.mjs`, `public/next/1999-restored-profiles.js`, narrow data-only modifications in `public/next/next.js`, `src/1999/full-world-generator.mjs` and browser mirror.
`raceDays` values starting '~' are *approximate game patterns*, not reported official totals.

## Known evidence to improve (not a fake blocker to the playable game)
Exact historical 1999 dates at all venues, genuine source-backed local stakes for tracks not in the original 93, and source-authenticated international fixtures remain future evidence upgrades. This gap does not close any WTW game track. No duplicated invented stake events, grades, purse or results. Historical races moved to different tracks or suppressed dates require separate canonical decision.

## November 12 alternate-world rule
All **118 North American Track_IDs** remain operational in 1999, even those closed in actual history. This is intentional alternate history, not a historical fact claim. The **16 international courses** remain active. Added WTW ungraded feature races live in `public/next/1999-alternate-stakes.mjs`, never in the historical stakes source. WTW source stakes and game-model events stay distinguishable in race files and test data.
