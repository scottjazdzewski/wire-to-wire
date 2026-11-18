# WIRE TO WIRE — Racing Manager UI & Historical Archive

> **Active UI update (2026-11-09):** The site root `/` now serves the **approved Google Drive Office FM Track Profile Foundation v30** (source SHA-256 `cfd2c76f838ee6c7873ffc840a1dd026e31cb6a2afe2ce685b8918cc011895f5`) with its original behavior, compact three-column Office, messaging, stable, calendar, decision consequences, and profiles. It is externalized into `public/index.html`, `office-v30.css`, and four `office-v30-*.js` scripts to work under the existing strict Cloudflare CSP. The **original 4 approved badge PNGs** from Drive `03_REFERENCE/WTW_PROFILE_BADGES` are displayed on the corresponding profile types without reinterpretation. The previous D1/records interface remains reachable at `/archive/`; its API and historical tables are unchanged. The v30 Office is a **2014-dated UI/workflow prototype, not the completed 1999 simulated game**, and it does not yet consume protected 1999 game-run state. GitHub CI passed on the root switch, but authenticated Cloudflare visual-QA could not be performed in this environment. Canonical future UI editing remains in `WIRE_TO_WIRE_UI_CURRENT/01_CURRENT_BUILD/index.html`; sync only approved future promotions.\n\n
A **new, independent** Cloudflare Pages + D1 project for a Thoroughbred racing management game and source-backed history archive. The site now opens on a game-style command center with role and involvement preferences, then keeps the source archive and correction desk available. These preferences are a UI foundation; they do not yet drive a simulation engine. It does **not** share code, databases, Cloudflare deployment or credentials with Rail & Rye or Hockey Lab.

## Current game UI foundation

The command center lets the player choose an Owner, Trainer, Farm Manager, Breeder, or Jockey lens and set Hands-on, Balanced, or Executive involvement. Preferences are saved locally in the browser. Horse, people, and farm screens use replaceable visual-asset placeholders. Compact horse profiles keep sire, dam, source-recorded placings, season connections, and archive limitations together; unknown lifetime starts and earnings remain marked unavailable.

## What already works

- Explore seasons from a real **curated 1953–1955 WTW source snapshot**, including winners and recorded tracks.
- Search and open horse profiles, people, race entries, owners, trainers, jockeys and breeders.
- Click from a horse to its season-level connections and race results, or from an owner/trainer to their horses.
- Propose corrections to entity names, race fields, connection IDs, and result positions. Review **original / proposed values**, add a reason, approve for promotion or reject.
- **Source-preserving by construction:** approving a change does **not** rewrite the historical master, gameplay data or even the D1 snapshot. All changes remain a separate revision queue.
- WTW supplied branding (deep green, black, white, red and silver) and mobile responsive layout.
- Dedicated Access gate for deployed site; no public historical admin website by accident.

## Important limits

This first version is **NOT** the entire WTW history. The data sample contains 1953–1955 source-linked records only; it is marked clearly. The full historical ledgers, complete barn/location history, pedigrees, championships, awards and 87,500-horse opening population are **not yet imported**. Some race dates are deliberately unknown. Season trainer/jockey assignments **do not prove** individual race-day mounts; they are labeled year-level evidence. Exact horse barn is not inferred from ownership circuit.

The existing `wire-to-wire.pages.dev` Cloudflare Pages site deploys from this repository's `main` branch, and its Cloudflare Access sign-in gate is active. The owner-reported D1 binding and full staged H/S/E/P/B import both have a remote audit pass. The remaining check is confirming that a signed-in site session reads D1. The imported snapshot covers stakes history through 1998, not every ordinary race or complete lifetime starts and earnings.

## Run the UI immediately (no Cloudflare account required)

```bash
cd wtw-canon-desk
python3 -m http.server 8000 --directory public
```
Open <http://localhost:8000>. The interface uses `public/sample-history.json` and stores draft correction proposals in **this browser's localStorage**. Those drafts are **not synced** to D1 or the WTW source data. Use this mode to decide the layout and workflow.

## Existing Cloudflare Pages deployment

The production site already uses the GitHub Pages connection for `wire-to-wire.pages.dev`. Commits to `main` trigger Cloudflare Pages deployments. Do not create a second Worker, Pages project, or D1 database for this app. Follow [GITHUB_CLOUDFLARE_SETUP.md](GITHUB_CLOUDFLARE_SETUP.md) to verify the existing D1 binding and Access runtime settings. Local development still uses Wrangler and the local-only bypass described above.

## Data contract and next phases

`entities` are horses, named people, organizations and tracks keyed by **immutable ID**. `races` and `results` are keyed by edition ID and position. `connections` relate a horse to a person/owner/breeder by year; these are **season-level** unless a separate event record establishes a particular engagement. `change_requests` + `change_audit` make a durable queue. Once approvals are reviewed, a later controlled promotion process can update the authoritative WTW source using exact-ID joins and multi-source consistency checks.

Next: import historical **all-year** source sets in paginated batches, support more complex season edits and deeper pedigrees, implement period-specific barn location intervals, and add diff/rollback-aware promotion that updates linked sources. At that stage we should develop a separate process for incremental authoritative imports with source hashes and QA gates.

## Safety notes

- Never import private source documents into the `public/` folder unless deliberately intended as a public preview. Protect all Worker routes with Access before production.
- Don't send Cloudflare API credentials or passwords into GitHub files.
- No write route changes source entities, races, or connections. The `APPROVED_FOR_PROMOTION` state records a decision, not a database mutation.
- D1 data import uses `INSERT OR IGNORE` so test imports do not override previously imported IDs.
## Historical import and Cloudflare launch

The full historical data is staged in this **private** repository but is not yet confirmed loaded into the Cloudflare database. To finish the separate WTW Pages + D1 launch, follow [WTW_OWNER_LAUNCH_CHECKLIST.md](WTW_OWNER_LAUNCH_CHECKLIST.md). A manual GitHub Action, **WTW D1 historical import (manual, isolated)**, can validate locally or import into *only* the verified empty `wtw-canon-desk-db`. All sensitive Cloudflare authorization values belong in GitHub Secrets or Cloudflare environment variables, never in repository files.
