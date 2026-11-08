# WTW Canon Desk — GitHub → Cloudflare deployment checklist

## GitHub repository

Repository: `scottjazdzewski/wire-to-wire` (private).

The GitHub integration currently has selected-repository access. To enable pushes, open the GitHub app installation settings at:

https://github.com/settings/installations/176694888

Choose **Configure** (if shown), under **Repository access** add `wire-to-wire` to the selected repositories, and save. Do not add the Rail & Rye or Hockey Lab code to the WTW repository.

After the repo appears in the connected GitHub repository list, upload these files into the **repository root** (not a nested `wtw-canon-desk` subfolder). Keep the app private.

## Cloudflare: distinct WTW resources

Provision a new Cloudflare Worker named `wtw-canon-desk` and a separate D1 database `wtw-canon-desk-db`. The existing projects' resources are untouched.

1. In `wrangler.jsonc`, replace the placeholder `database_id` with the ID returned by `wrangler d1 create wtw-canon-desk-db`.
2. Apply the schema and seed reviewed data using the `README.md` instructions. Do not import the whole WTW universe until authoritative sources and update rules have been approved.
3. Configure Cloudflare Access to protect **all traffic**, allow only approved identities, and set the `ADMIN_EMAIL` Worker variable to the expected email address(es).
4. Verify the Worker fails closed with an unauthenticated request. Never deploy with an unverified Access configuration, live secrets in the repo, or the local bypass enabled in production.
5. Use the Workers Builds Git integration for `scottjazdzewski/wire-to-wire` (root directory), or deploy via `npm run deploy` with an authorized Wrangler session.
6. Confirm the deployed URL and the D1 read/write counts in Cloudflare, then perform the permission and edit-proposal smoke test.

## Data integrity

The v0.1 site uses a **1953–1955 curated sample**, not the 87,500-horse full WTW universe. Name corrections are proposals only. Approving a proposal does **not** automatically rewrite game canon or race results. Keep immutable IDs and protected historical achievements intact.