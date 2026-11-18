# WIRE TO WIRE — Live Cloudflare Pages + Private Historical Database

Last updated: 2026-11-08.

## Verified project status

- GitHub repository: `scottjazdzewski/wire-to-wire` (private). Brand and sample browser deployed via the owner's existing Cloudflare Pages Git connection.
- Site: `wire-to-wire.pages.dev`, deployed through the existing Cloudflare Pages Git connection. A live request was observed redirecting to the Cloudflare Access sign-in gate on 2026-11-08; authenticated page and API behavior were not inspected.
- D1 database: `wtw-canon-desk-db`, created by the owner and reported as bound to Pages under variable `DB`; verify the signed-in runtime connection.
- Pages API: `functions/api/[[path]].js` now serves routes via `src/worker.js` and `src/access-jwt.js`. This verifies **signed Cloudflare Access JWT** and administrator email before any D1 call.
- Private historical JSON source snapshots are in `data/history-source/2026-11-07/`; they are **NOT** in the deployed public assets.
- Import compiler: `scripts/build-full-history.mjs`. D1 extensions: `migrations/0002_full_history.sql`; verification and test scripts checked by GitHub Actions.
- **Important:** The staged H/S/E/P/B snapshot import and remote D1 audit passed. The imported stakes archive spans 1864–1998 but is not a ledger of every ordinary race or a complete lifetime career record. Access sign-in is active; the signed-in website must still be checked for the `ARCHIVE CONNECTED` badge and full year selector. If D1 is unavailable, the app falls back to the limited 1953–1955 sample.

## Next step — Verify the existing Pages-to-D1 connection

1. In Cloudflare dashboard, go to **Workers & Pages** → **wire-to-wire** (Pages).
2. Open **Settings** → **Bindings** and confirm variable `DB` points to the existing `wtw-canon-desk-db`.
3. If the binding is present, sign in to https://wire-to-wire.pages.dev/ and confirm the badge says **ARCHIVE CONNECTED** and the season selector spans the imported years.
4. If the site falls back to **ARCHIVE PREVIEW**, review the displayed API error and verify the Production Pages Access variables below, then redeploy.
5. Do not rerun the initial import; the remote D1 already contains the audited snapshot.

Cloudflare source: https://developers.cloudflare.com/pages/functions/bindings/#d1-databases

## Next — Verify Access and API authorization

The production hostname currently redirects visitors to the Cloudflare Access sign-in gate. Verify the application policy for `wire-to-wire.pages.dev` and confirm the signed-in session receives a valid identity at `/api/bootstrap` while unauthorized visitors are rejected. Add or verify these exact Pages **Variables and Secrets**, without committing their values in Git:

- `TEAM_DOMAIN` = the actual Cloudflare Zero Trust team URL (e.g., `https://example.cloudflareaccess.com`)
- `POLICY_AUD` = application Audience tag from Cloudflare Access
- `ADMIN_EMAIL` = exact authorized administrator email (one or comma-separated)

Redeploy after setting them. API checks signed JWT algorithm, signature, issuer, audience, expiry, and allowed email, with fail-closed behavior and tests. Do not use any access bypass in production.

Cloudflare source: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/

## Finally — Build and import the historical D1

Do **not** paste large private data into a public Pages folder. Run the full-history compiler in GitHub Actions or a trusted authorized environment and apply the migrations to only `wtw-canon-desk-db` using Wrangler with an appropriately scoped Cloudflare API token.

The compiler creates private SQLite / D1 import SQL files for horses, horse-year records, race editions and placings, pedigree edges, bloodlines, and party/owner/trainer/jockey links. Source snapshots are read-only, and data anomalies stay visible in the QA manifest. Verify race result integrity, permanent IDs, approved user names, owner/trainer year-level links and import counts. **Do not update original Google Drive master files.**

We should not treat any historical claim as GOLD verified solely because it was imported. Source books include some QA-pending rows. Only surface verified evidence status.

## Separation rule

WTW has its own Pages site, D1 database, source import and GitHub repository. Rail & Rye and Hockey Lab are not part of any WTW migration or deployment.
