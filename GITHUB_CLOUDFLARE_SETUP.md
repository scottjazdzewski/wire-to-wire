# WIRE TO WIRE — Live Cloudflare Pages + Private Historical Database

Last updated: 2026-11-08.

## Verified project status

- GitHub repository: `scottjazdzewski/wire-to-wire` (private). Brand and sample browser deployed via the owner's existing Cloudflare Pages Git connection.
- Site: `wire-to-wire.pages.dev`, deployed through the existing Cloudflare Pages Git connection. A live request was observed redirecting to the Cloudflare Access sign-in gate on 2026-11-08; authenticated page and API behavior were not inspected.
- D1 database: `wtw-canon-desk-db`, created by owner but not yet verified as **bound** to Pages.
- Pages API: `functions/api/[[path]].js` now serves routes via `src/worker.js` and `src/access-jwt.js`. This verifies **signed Cloudflare Access JWT** and administrator email before any D1 call.
- Private historical JSON source snapshots are in `data/history-source/2026-11-07/`; they are **NOT** in the deployed public assets.
- Import compiler: `scripts/build-full-history.mjs`. D1 extensions: `migrations/0002_full_history.sql`; verification and test scripts checked by GitHub Actions.
- **Important:** The D1 binding and full historical import are still unverified. If D1 is unbound or unavailable, the app falls back to the limited 1953–1955 sample. Access sign-in is active on the host; the authenticated page, API variables, and full-history data are not yet confirmed. No full history is live.

## Next step — Bind D1 to the existing Pages website

1. In Cloudflare dashboard, go to **Workers & Pages** → **wire-to-wire** (Pages).
2. Open **Settings** → **Bindings** → **Add** → **D1 database**.
3. Set **Variable name** exactly `DB`.
4. Choose existing D1 database `wtw-canon-desk-db`.
5. Save, then deploy the new GitHub main commit or trigger **Redeploy** to apply binding.
6. Check project deploy logs. The API remains fail-closed until its binding and signed Access identity settings are valid.

Cloudflare source: https://developers.cloudflare.com/pages/functions/bindings/#d1-databases

## Next — Verify Access and API authorization

The production hostname currently redirects visitors to the Cloudflare Access sign-in gate. Verify the application policy for `wire-to-wire.pages.dev` and confirm both HTML and `/api/bootstrap` reject unauthorized visitors. Add or verify these exact Pages **Variables and Secrets**, without committing their values in Git:

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
