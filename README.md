# WIRE TO WIRE — Historical & Canon Desk (v0.1)

A **new, independent** Cloudflare Workers + D1 project for browsing and curating the Wire to Wire racing universe. It does **not** share code, databases, Cloudflare deployment or credentials with Rail & Rye or Hockey Lab. The existing WTW Office build is also **untouched**.

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

No Cloudflare account has been accessed, no D1 database or Worker has been created in the account, and this site is **not deployed**. The downloadable folder is the tested starting application and needs its own repository and Cloudflare deployment.

## Run the UI immediately (no Cloudflare account required)

```bash
cd wtw-canon-desk
python3 -m http.server 8000 --directory public
```
Open <http://localhost:8000>. The interface uses `public/sample-history.json` and stores draft correction proposals in **this browser's localStorage**. Those drafts are **not synced** to D1 or the WTW source data. Use this mode to decide the layout and workflow.

## Set up a separate private Cloudflare project

1. GitHub repository: **`scottjazdzewski/wire-to-wire`** (separate from Rail & Rye and Hockey Lab). Allow the connected ChatGPT GitHub app to access that repository in the app installation settings before asking ChatGPT to push changes.
2. In Cloudflare, create an **independent Worker** named `wtw-canon-desk` and **new D1 database** named `wtw-canon-desk-db`.
3. Use `npm install` and `npx wrangler d1 create wtw-canon-desk-db` to obtain the D1 UUID. Replace `REPLACE_WITH_WTW_ONLY_D1_UUID` in `wrangler.jsonc`.
4. Apply schema to local D1: `npx wrangler d1 migrations apply wtw-canon-desk-db --local`.
5. Build and seed **local test data**: `node scripts/build-seed.mjs && npx wrangler d1 execute wtw-canon-desk-db --local --file=./data/seed.sql`.
6. For local full-stack testing, copy `.dev.vars.example` to `.dev.vars`, edit its placeholders, then run `npx wrangler dev`. `DEV_BYPASS_ACCESS=true` works **only on localhost**. Do not use it in production.
7. In Cloudflare Workers & Pages → this Worker → **Access**, select **Protect this Worker → All traffic** with an allow policy for your account or approved email. Configure the Worker secret/variable `ADMIN_EMAIL` to a comma-separated allowlist of authorized editor email addresses. The Worker explicitly refuses access if `ctx.access` is absent or if the email is not authorized.
8. Before deploying with `npx wrangler deploy`, create the separate remote D1 tables using `npx wrangler d1 migrations apply wtw-canon-desk-db --remote`. Import sample records only when you're comfortable: `npx wrangler d1 execute wtw-canon-desk-db --remote --file=./data/seed.sql`.
9. Make sure Access is enabled and test the protected route in an incognito session. **Do not deploy** while it is unprotected or with placeholders.

Cloudflare documentation: [Static assets](https://developers.cloudflare.com/workers/static-assets/binding/), [Access for Workers](https://developers.cloudflare.com/workers/configuration/cloudflare-access/), [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/).

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
