# WIRE TO WIRE — 1999 TRACK MEET PROGRAM / SITE WIRING
2026-11-12 · Game production overlay · DOES NOT REPLACE canonical 1999 track or stakes registries

## Mission delivered
- 134 canonical ID-preserving track schedules, surfaces, race-day patterns, source tags, and status.
- 93 previously source-linked stakes retained by their exact IDs, original dates, track IDs, grades, distances, surfaces, and purses; no duplicate stakes or invented race results.
- Verified that every linked stakes date falls inside its host course's modeled or verified 1999 meet.
- 16 historical-only courses remain available as historical venues but cannot run 1999 cards.
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
Remaining US/Canadian 64 plus 5 alternate-survival, 8 fictional, 16 international have GAME_MODELED calendars as test inputs, **not certified 1999 historical dates**. Historical closed = 16. Never relabel approximations as historical fact.

## Source of truth
Track identities: WTW canon in `public/data/track-geography-v33.json` + existing 1999 world.
Stakes identities and dates: source-locked 93 in `src/1999/opening-world.v1.mjs` and browser canon mirror.
Site operating projection: `public/next/1999-track-program.mjs`, keyed by immutable Track_ID, with `basis` on every row.
Site wiring: `public/next/1999-ui-source.mjs`, `public/next/1999-restored-profiles.js`, narrow data-only modifications in `public/next/next.js`, `src/1999/full-world-generator.mjs` and browser mirror.
`raceDays` values starting '~' are *approximate game patterns*, not reported official totals.

## Known evidence to improve (not a fake blocker to the playable game)
Detailed 1999 official racing days at every venue, domestic local stakes coverage for tracks not among the original 93, genuine surface-specific race conditions and particular international exact fixture dates remain future evidence upgrades. No duplicated invented stake events, grades, purse or results. Historical races moved to different tracks or suppressed dates require separate canonical decision.
