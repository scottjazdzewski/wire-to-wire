# WIRE TO WIRE — GitHub to Cloudflare

## Current status (2026-11-08)

**GitHub: DONE.** The independent private repository `scottjazdzewski/wire-to-wire` now contains the WTW Canon Desk application, actual brand logo, browser, curated 1953–1955 source sample, D1 schema, safe-edit review API, and automated source/security tests. Rail & Rye and Hockey Lab were not changed.

**Cloudflare: NOT YET CONNECTED.** There is no confirmed live WTW URL, Worker, or D1 database yet. Cloudflare setup requires the account owner's authorization in the Cloudflare dashboard.

## First live website: UI preview using Cloudflare Pages

This is the shortest route to a normal website address so the owner can review functionality. It runs **sample mode**: correction proposals are stored only in that browser, not in D1 or the historical master. A private GitHub repository does **not** make the deployed Pages URL private.

1. Open https://dash.cloudflare.com/ and select **Workers & Pages → Create application → Pages → Connect to Git** (or **Import an existing Git repository**).
2. Authorize the Cloudflare GitHub app to use **only the WTW repository** if it is not already listed. Select `scottjazdzewski/wire-to-wire`.
3. Set project name `wtw-canon-desk`, production branch `main`, framework preset `None`, build command `exit 0`, output directory `public` and root directory the repository root.
4. Deploy. Cloudflare will give the site its own `*.pages.dev` URL. Do not guess the actual URL before the deployment appears.
5. **Protect the production `<project>.pages.dev` hostname behind Cloudflare Access before treating it as private.** Cloudflare Pages' Settings → Enable access policy initially protects preview deployment URLs only, **not** automatically the production `*.pages.dev` URL. To protect production, use Cloudflare's documented production Pages/Access procedure and verify in a signed-out or incognito browser that an unauthenticated visitor cannot see the site.
6. Once the initial website looks right, do not promote the demo browser's proposals as authoritative historical edits.

Cloudflare references: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/ and https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain.

## Full persistent/private editing: Cloudflare Worker + D1

Once the layout and review workflow are approved, run the Worker in this same **separate WTW project**, with its own D1. This turns the change queue into a durable authenticated database review system (still **not** an automatic rewrite of the frozen historical canon).

1. Create D1 `wtw-canon-desk-db` in the same Cloudflare account, distinct from other projects' databases. Copy its real UUID into `wrangler.jsonc` replacing `REPLACE_WITH_WTW_ONLY_D1_UUID`.
2. Apply `migrations/0001_initial.sql` via `npx wrangler d1 migrations apply wtw-canon-desk-db --remote`.
3. Optionally seed the reviewed sample with `node scripts/build-seed.mjs` then `npx wrangler d1 execute wtw-canon-desk-db --remote --file=./data/seed.sql`. **Do not import the entire WTW history yet.**
4. Configure **Cloudflare Access → Protect this Worker → all traffic**, with an allow policy for the owner, and set `ADMIN_EMAIL` to that approved identity. The Worker refuses production requests without Access identity. Do not set `DEV_BYPASS_ACCESS` in Cloudflare production environment.
5. Connect Workers Builds to the new WTW repository or deploy with an authorized Wrangler session. Verify an unauthenticated request is denied **before sharing the URL**.
6. Test search, season browsing, correction submission, persistence and approval audit. No existing race winner, owner/trainer relationship or permanent ID may be overwritten by a proposed edit; source promotion remains a separate later process.

Cloudflare reference: https://developers.cloudflare.com/workers/configuration/cloudflare-access/.

## Data authority

Current 1953–1955 demo is **not** the complete historical universe; it is an accurate scoped UI sample, not a second master. Preserve permanent horse/person/race IDs. Treat trainer, jockey and owner links as **season-level** unless documentary evidence establishes a specific race-day assignment or barn. All approved/rejected changes require attribution, source lineage and controlled promotion.

This repo has a GitHub Actions test workflow at `.github/workflows/ci.yml`, which runs `npm test` on pushes and pull requests.
