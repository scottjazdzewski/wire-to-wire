# WIRE TO WIRE — Historical Universe Full Import

**Status:** All five foundation sources staged in the PRIVATE GitHub repository; no full-data public release, D1 import, or live edit permissions yet.

## What was actually staged

| Data source | Source records | Authority |
|---|---:|---|
| Horse Master (H) | 3,856 | Historical horse identities, registered names, sex, foaling year, ancestors |
| Horse-Season Summary (S) | 5,221 | Year-level races and owner, trainer, jockey, breeder associations |
| Stakes Edition (E) | 5,370 | Race year/date, track, winner, second, third, context and QA flags |
| Pedigree Edges (P) | 8,408 | Source parent/child relationships (including references outside H) |
| Bloodline + Breeding (B) | 3,856 | Historical breeding/pedigree metrics and statuses |

These were read from the live WTW connected Google Sheets, not invented or regenerated. The `data/history-source/2026-11-07/*.json` snapshots keep exact source headers and row values. The source sheets are **not modified**. Some source workbooks are still marked **QA PENDING**; this import is not a historical GOLD certification. After each future source release, refresh snapshots with explicit source provenance and rerun the importer.

## Functionality already engineered

- Private source export snapshots in GitHub, **outside `public/`** so Cloudflare Pages does not publish them.
- `scripts/build-full-history.mjs` builds a normalized D1 read model, retaining all raw source fields as JSON in details tables, without losing permanent IDs.
- `migrations/0002_full_history.sql` adds horse-season, race detail, pedigree, horse detail, and bloodline lookup tables to the original database schema.
- Season affiliations are labeled `HORSE_SEASON_SOURCE`; not asserted as per-race trainer, jockey or barn assignments.
- Missing horse references become explicitly labeled source-only placeholders rather than invented histories.
- Results are `INSERT OR IGNORE`; changing a winner/placing requires separate user approval and controlled canon promotion.
- An import manifest records counts, source SHA-256 hashes, year span and unresolved differences.
- Tests exercise the compiler and the full source snapshot in GitHub Actions.

## What must happen before the 1864–1998 history appears live

**Do not copy the private snapshots into `public/` while the website remains publicly accessible.**

1. Protect WTW production with Cloudflare Access so only the owner (and anyone the owner explicitly authorizes) can view private history. Test in a signed-out/incognito browser to ensure unauthenticated access is denied.
2. Create **a new, WTW-only D1 database** named `wtw-canon-desk-db`. Do not reuse databases from Rail & Rye or Hockey Lab. Cloudflare D1's **500 MB per-database Free limit** is distinct from account-total storage.
3. Apply migrations `0001_initial.sql` and `0002_full_history.sql` to the new database.
4. Run `npm run db:build:full` in a checked-out copy of this repository. The SQL is written only to `generated/private-d1/` (Git-ignored). Review `manifest.json` and the QA issues before executing SQL.
5. Execute generated SQL files **in lexicographic order** with Wrangler against the WTW-only D1 database. The source manifest final file `10_source_import.sql` documents the import checksum.
6. Connect the D1-backed private app and finish **server-side pagination / year navigation**, because the original preview uses a small sampled bootstrap. Verify every year, horse, owner, trainer, and runner placement through 1998 before declaring the universe browsable.
7. Enable persistent correction proposals, audit logs and an explicit approval-to-source-promotion pipeline. **Approvals alone never silently mutate the historical master.**

**Website currently:** Cloudflare Pages `wire-to-wire.pages.dev` is an initial public UI sample; it does not yet query the full private historical source. GitHub app permissions and Pages deployment are already connected.

For Cloudflare Access guidance: https://developers.cloudflare.com/workers/configuration/cloudflare-access/ . Pages Access production behavior differs from preview deployments. Confirm production hostname coverage before exposing data.