# WIRE TO WIRE — Historical Universe Import Status

**Last verified:** 2026-11-08. **Status: full staged H/S/E/P/B snapshot imported and remote D1 audit PASSED.**

**Completed GitHub run:** https://github.com/scottjazdzewski/wire-to-wire/actions/runs/42452571016

**Target:** private Cloudflare D1 `wtw-canon-desk-db`, scoped to WTW. The imported data is not in the website's public `public/` folder. WTW's original connected Google Sheets remain untouched. No Rail & Rye or Hockey Lab content was modified.

## Verified imported records

| Table | Remote rows |
|---|---:|
| Entities (horses, people, farms, tracks) | 5,101 |
| Stakes race editions | 5,370 |
| Horse/owner/trainer/jockey/breeder season connections | 20,884 |
| Top-three placing results | 15,561 |
| Horse detail records | 3,856 |
| Horse seasons | 5,221 |
| Stakes edition details | 5,370 |
| Pedigree edges | 8,408 |
| Bloodline profiles | 3,856 |

Snapshot year coverage: **1864–1998** for stakes editions and horse seasons. Input source file rows: H 3,856; S 5,221; E 5,370; P 8,408; B 3,856. The import's final audit passed exact row-count comparisons, the source SHA-256 manifest digest, and the owner-approved names (Double Duty, Northbound Train, Miss Meridian, Bramble). The workflow also ran SQLite foreign-key checks.

## Coverage and certification warning

**Import passing is NOT historical GOLD certification.** This is the H/S/E/P/B working source snapshot. It is not a full ledger of every ordinary race, its dates and trainer assignments are not all independently authenticated, and QA-pending historical claims remain unresolved. Connections originating in S are **year-level**, not guaranteed race-day trainer, owner, jockey or stable claims. No historical dates or identities were invented to fill gaps.

## Editable names and records

- `migrations/0003_editable_names.sql`: `display_name_overrides` and append-only `name_edit_audit`. The migration was applied successfully during the verified import.
- The website uses secure `POST /api/names` to edit displayed names by permanent IDs. Every registered horse, owner, trainer, jockey, breeder, farm, stable, track, race and identified pedigree relation has an inline name-edit control in the relevant view.
- Display-name edits update the private D1 overlay and are logged; **they do not change original source values, canonical IDs, race results, or frozen game-engine records**. The editor can restore the source name. The Corrections page separately lists recent name edits.
- Non-name changes remain proposals in `change_requests`. Approval is not automated source promotion.

## November 8 season selector repair

The owner reported that other seasons were not visible even though all staged history had imported. The app previously used an all-or-nothing `/api/bootstrap` request. The backend launched twelve concurrent D1 reads (Cloudflare permits at most six concurrent D1 connections per Worker invocation), and a failed request silently put the site into a curated 1953–1955 demo mode. This was a concrete startup design defect.

Fix on `main`: serialize bootstrap D1 reads; populate the season selector from the backend's `years` list instead of inferring years only from already loaded races; add a regression test that verifies 1864, 1953, and 1998 and enforces at most one active database query. Tests pass.

**Still requires user-side live confirmation after Cloudflare deploy:** authenticated session must show `D1 CONNECTED`. If it still shows `CURATED DEMO`, inspect the app's displayed API error and check that Cloudflare Pages Production includes `TEAM_DOMAIN`, `POLICY_AUD`, `ADMIN_EMAIL` and binding `DB`. GitHub cannot view the user's signed-in Pages session or Cloudflare Pages Production environment secrets.

## Website delivery status

- Cloudflare Pages site: https://wire-to-wire.pages.dev/
- Repository: https://github.com/scottjazdzewski/wire-to-wire
- The owner verified a Cloudflare Access login is required on the production URL.
- Recent site changes: cross-category historical search, compact decade navigation, horse profiles with source-year owner/trainer/jockey/breeder connections and offspring, track registry, and name editing with source-name restoration and audit.
- **One item still needs live browser verification:** after logging into the website, the badge must say **D1 CONNECTED**, the year selector should include historical years through 1998, and saving a test name on a WTW-only display alias should persist after refresh. This cannot be established from GitHub Actions import success alone.
- If the website says **CURATED DEMO** with an API warning instead, check the Production Pages variables `TEAM_DOMAIN`, `POLICY_AUD`, and `ADMIN_EMAIL`, and redeploy. The API fails closed if its signed Access JWT cannot be verified.

## Operational safety

**Do not run the initial historical import again against the populated D1.** Its preflight rejects a non-empty target to avoid overwriting edits. Any later source refresh must use an explicit change-managed, auditable incremental import plan, and preserve name overrides and human decisions.

Project owner workflow/setup reference: [WTW_OWNER_LAUNCH_CHECKLIST.md](WTW_OWNER_LAUNCH_CHECKLIST.md).
