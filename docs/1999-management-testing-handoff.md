> **SUPERSEDED — DO NOT USE AS THE CURRENT GAMEPLAY BUILD PLAN (November 13, 2026).**
>
> Current, authoritative horse-generation → first-playable-race handoff: [FOUNDING_1999_SINGLE_SOURCE_HANDOFF_CURRENT.md](./FOUNDING_1999_SINGLE_SOURCE_HANDOFF_CURRENT.md).
> This older file contains obsolete 84-youngstock references and/or retired 2014/B01/bulk-world instructions. The live clean foundation contains **zero racing horses, 26 selected jockey identities, 20 trainer identities, 73 protected breeding horses, 37 organizations and 118 North American/Cuban tracks**. Do not reactivate old generated entities.
>

# WIRE TO WIRE — NEW TESTING WINDOW HANDOFF
**Date:** November 12, 2026  
**Project:** WIRE TO WIRE (horse-racing management game, not Rail & Rye)  
**Repository:** https://github.com/scottjazdzewski/wire-to-wire  
**Approved live game:** https://wire-to-wire.pages.dev/next/?world=1999  
**Default homepage:** https://wire-to-wire.pages.dev/ (redirects to that existing management UI)  
**1999 diagnostic browser ONLY:** https://wire-to-wire.pages.dev/1999/  
**Known source canon:** https://docs.google.com/spreadsheets/d/1Lhpe6DG1foQ2-zayQBg4bKpTtu4MP_itpM1zo2GRSEA/edit  
**Snapshot checked:** `main` commit `ae6cc3023051718db33643e6b88a39c6a3b0ed5a` (verify current `main` on arrival; there are concurrent working windows).

## USER DIRECTIVE — NO EXCEPTIONS

> We have spent substantial effort building a beautiful, premium Football Manager-style management UI. I want the entire January 1, 1999 racing universe connected **to that same UI**, so I can open and test EVERY screen. Never destroy, replace, simplify, or redesign that UI just to display the data. The plain /1999/ world screen is a diagnostic, NOT our game. I want one completely clean Jan 1, 1999 universe. No 2014 demo scenarios, dates, races, Powerline decisions, or prior save data contaminating the active game. Historic material before 1999 remains real world history, separate from old UI demo state. Fix what breaks; don't return audit lists and pretend it is finished.

The next window is a **1999 GAME TESTING & DEFECT-FIXING WINDOW**, not a historical-narrative window, a mockup builder, or a replacement UI window.

### Protect these files/decisions
- `public/next/index.html`, `public/next/next.css`, `public/next/next.js` are the **approved visual and interaction baseline**. Preserve ALL layouts, profile pages, navigation, cards, photographs, trophies, badges, track designs, and responsive geometry. Never reintroduce a second visual system.
- `public/index.html` redirects to `/next/?world=1999`. Never send users back to `/1999/` as the homepage.
- Existing 1999 source/canon identity values, horse IDs, pedigrees, approved race results, farm/trainer/owner ties, names and geographic locations cannot be overwritten with simulated replacements.
- 1999 generation is for **new, non-canonical** population only. Temporary synthetic names can change later through the separate name engine, but IDs and relationships must survive.
- Changes must be narrow, tested and committed to the latest GitHub `main` with concurrent-edit checks. Avoid changing unrelated UI files; don't assume the branch is static.

## WORLD AVAILABLE (DO NOT CONFUSE TEST RECORDS WITH HISTORIC CERTIFICATION)
The read-model generator in `src/1999/full-world-generator.mjs` (browser mirror `public/1999/engine/full-world-generator.mjs`) supplies:
- 87,500 horses, including 267 locked source-grounded opening horses and 87,233 simulated population-fill horses.
- 134 track identities, 3,308 ownership groups, 4,200 trainer operations, 5,234 test facilities, 36 test auctions.
- 31 source-active stallions, 2,036 broodmare boarding records, and 93 source 1999 stakes schedule entries.
- Synthetic capital/wealth, costs, capacities, reputation, attribute catalog (53 horse attributes), personnel, locations, test condition books, operating calendars and horse-owner stable assignments.
- The source-backed historical universe is **NOT** yet entirely wired to all 87,500 records; generated records are not authenticated historical horses.
- The test world still needs complete transactional racing, race-entry eligibility, horse shipping/rest, AI stable activity, race results, cash postings, breeding and sales engine execution, and durable transactional game-state persistence.

### Existing game wiring
- `public/next/1999-bootstrap.js`: creates clean `1999-01-01` game state, schema `WTW_1999_CLEAN_CAREER_V3`, independent localStorage key `wtw1999ManagementStateV1`. The older `wtwOfficeStateV30` and earlier 2014 demo cases must NOT be loaded into the active career. Opening current case is `opening-stable`.
- `public/office-v30-4.js`: underlying previous Office compatibility engine. Dates, saves/import validation, clock progression and reset changed to avoid importing 2014-era state; legacy code and static fixtures may still exist in source. They must never become active 1999 gameplay data.
- `public/next/1999-ui-source.mjs`: overlays **data only** onto existing Stable, Racing, Breeding, Sales, Personnel, Facilities, Finances, Tracks, World, inbox and Decision Desk screens.
- `public/1999/engine/local-api.mjs`: paged 1999 world read APIs including owner-horse index; additional immutable source data in `src/1999/opening-world.v1.mjs`, browser `public/1999/engine/canon-mini.mjs`.
- `ownedHorseIndexes(ownerId)`: inverse owner allocation allows complete mixed source + synthetic stable by owner without generating 87,500 objects in memory.
- Existing source-anchored opening-case inbox replaces old demo decision text on the visible UI.
- `scripts/1999-management-browser-smoke.sh` runs a real Chromium check of the actual premium UI. Tests include `tests/1999-management-ui-restore.test.mjs`, `tests/1999-management-screen-data.test.mjs`, `tests/1999-owned-stable.test.mjs` and other `1999-*.test.mjs`.

## EXACT VERIFIED STATUS AT HANDOFF — DO NOT LIE ABOUT GREEN BUILD

Commit `ae6cc3023051718db33643e6b88a39c6a3b0ed5a`:
- **Cloudflare Pages: SUCCESS** (deployment uploaded).
- **january-1999-source: SUCCESS**.
- **test (current active suite): SUCCESS**.
- **management-1999-browser: FAILURE**. Most checks passed; the newly added **Continue action did NOT advance from 1999-01-01 to 1999-01-02** in the Chromium test. See https://github.com/scottjazdzewski/wire-to-wire/actions/runs/43212807982/job/131164440010 . The browser probe successfully checked the approved UI, Jan 1 display, source adapter, 87,500/134 counts, stable, Breeding, Sales, Finances, original departments, dedicated 1999 save key, and absence of imported old 2014 state. **Next window's first engineering task: fix the Continue/date persistence behavior and get that Chromium test passing without altering the UI.**
- The default `npm test` runner `scripts/run-current-tests.mjs` excludes old static UI snapshot tests that assumed the 2014 page at root, but those tests remain present under `npm run test:legacy-ui`. Do not claim every legacy test passes; don't delete historical source integrity tests or assume old visual tests are all meaningless. Update genuinely stale tests against approved current UI and keep substantive visual constraints.

## TEST PLAN — WORK SCREEN-BY-SCREEN, FIX EACH DEFECT

1. **Start/save/reset/date:** New game starts 1999-01-01; title/date and underlying engine agree. Continue, +day/week/month/year and save/load work. Any reset returns ONLY to clean Jan 1 1999, with no old demo cases or finance. Test refresh, mobile, and multiple visits. Check old `wtwOfficeStateV30` is ignored. ***Fix Continue action first.***
2. **Office:** Homepage and management sidebar have the original approved Football Manager design. 1999 inbox + Decision Desk are usable, old named 2014 demos gone; cash/operations/roster counters correctly align.
3. **Stable and Horse Profile:** A chosen owner sees ALL of their owned horses including source and synthetic horses. Open the exact same horse in stable and profile, with stable owner/trainer/base/ID/pedigree/attributes and correct provenance; no name bleed; real roster pagination and search.
4. **Racing and Tracks:** Inspect each of 134 tracks, source verified historical 1999 stakes vs proposed condition books, race calendar, Racing > Race Planning, eligibility, entries and results. No unrun 1999 race has a made-up result. Test travel and rest/schedule realism when actual mechanics are connected.
5. **Breeding:** 31 active stallions + linked stud farms, 2,036 mare boarding records, pedigree relationships/age/foaling geography, sale/breeding logic. No imaginary pregnancy or foal recorded as real.
6. **Sales/Auctions:** 36 opening scheduled test sales, named sale locations and catalog, horse ownership links, transaction state. No premature transfer/payment.
7. **Personnel/Facilities/Finances:** 3,308 owners with materially unequal rosters and wealth, 4,200 trainer operations, named people/geographic bases, 5,234 test facilities and barn capacities. Verify accounting and reputation state visibly labeled.
8. **World/Search/History:** Browse and search all 87,500 IDs using paging; preserve 134-track directory and established history. Pre-1999 racing history must be accessible as past canon but not accidentally inserted into the clean gameplay epoch.
9. **Responsiveness:** Open every screen on phone and desktop. Fix broken overflow, controls and clipped artwork **without broad redesigns**. Review actual screenshot evidence.

### Engineering operating method
- Open `main` and this handoff in GitHub first. See last successful workflow and first failing test/log.
- Fix actual code and rerun active Node, Chromium, and Cloudflare checks. Do not simply suppress tests to make release green.
- Share a short, dated checkpoint after each substantive set of completed fixes. Report **what is now working**, what's not implemented, exact commit and deployed status. Avoid repetitive approvals/clarifications.
- Do not break public canonical history or rewrite previously accepted source/data.
- If work is in another concurrent window, use freshest GitHub state; avoid stale blob SHA writes and racing the other worker.
- **Do not claim a fully playable racing season exists** until race/finance/breeding/AI transaction loop is actually executable.

## COPY TO NEXT CHAT
“Become my WIRE TO WIRE **1999 gameplay testing and integration window**. Read `docs/1999-management-testing-handoff.md` in `scottjazdzewski/wire-to-wire` and continue on the latest `main`. **Do not change or replace the approved `/next/` UI.** The clean game starts Jan 1, 1999, with no 2014 demo contamination. First fix the actual Chromium browser failure where Continue doesn't move the date to Jan 2. Verify CI and Cloudflare deploy, then test and repair every existing management screen using the 87,500-horse world and canonical historic connections. Preserve every visual design and immutable ID. Commit fixes. No narratives, parallel ledgers, UI replacements, fabricated results, or audit-only hold lists. Tell me exactly what's working and still missing.”
