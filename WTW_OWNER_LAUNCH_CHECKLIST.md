# WTW Historical Import: Owner Setup and Exact Clicks

The application remains **separate** from Rail & Rye and Hockey Lab. The original WTW Google Sheets are never changed by this workflow. **Do not paste any API token into ChatGPT, GitHub source code, an issue, or a screenshot.**

## Status

- Live Cloudflare Pages website: https://wire-to-wire.pages.dev/
- GitHub: https://github.com/scottjazdzewski/wire-to-wire
- Cloudflare D1: `wtw-canon-desk-db` (user-created and user-reported bound to the Pages project as `DB`)
- Full private history sources: `data/history-source/2026-11-07/`; not public files
- GitHub CI: source tests, source-to-SQL compiler and SQLite integrity checks
- **No confirmed remote D1 historical import or Cloudflare Access configuration yet.**

## 1. Secure the *production* site first

Cloudflare dashboard → **Workers & Pages** → **wire-to-wire** → **Settings** → **General** → **Enable access policy**.

Cloudflare documents an important trap: this initially protects only preview links, not the main `wire-to-wire.pages.dev` URL.

To protect the actual site, use **Manage** on the newly created policy → Cloudflare **Zero Trust** → **Access controls** → **Applications** → select the WTW app → **Configure**. Under **Public hostname**, remove `*` from the **Subdomain** field, leaving the production hostname, and **Save**. If prompted, give the production app a distinct name. Then return to **Workers & Pages → wire-to-wire → Settings → General → Enable access policy** again to protect preview deployments separately. Restrict **Allow** to your exact email identity, not Everyone.

**Verify in a brand-new private/incognito browser:** opening https://wire-to-wire.pages.dev/ must require Access sign-in. If the homepage is freely visible, stop here. See Cloudflare's current official guidance:
https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain

## 2. Set the 3 Pages backend variables

Cloudflare dashboard → **Workers & Pages** → **wire-to-wire** → **Settings** → **Variables and Secrets** → **Add**. Set all three in **Production**:

- `TEAM_DOMAIN` = `https://<your-team-name>.cloudflareaccess.com`. Find it via **Zero Trust → Settings → Team name and domain**.
- `POLICY_AUD` = WTW Access **Application Audience (AUD) Tag**. Find it via **Zero Trust → Access controls → Applications → (WTW app) → Configure → Additional settings**.
- `ADMIN_EMAIL` = your exact sign-in email.

Save each and **redeploy** the latest Pages deployment, so the values and the new D1 binding take effect. The API verifies signed Access JWTs before touching the database. Never add an auth bypass.

Cloudflare guide: https://developers.cloudflare.com/pages/functions/bindings/ and https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/

## 3. Create a Cloudflare D1-only API token

Open https://dash.cloudflare.com/profile/api-tokens → **Create Token** → **Create Custom Token** → **Get started**.

- Token name: `WTW D1 History Import`
- Permission: **Account → D1 → Edit** (some accounts label this D1 Write)
- Account resources: **Include → Specific account → the account with wtw-canon-desk-db**. Do **not** grant Global API Key or unrelated Worker, DNS, or billing permissions.
- **Continue to summary → Create Token**.

Copy the token once and keep it private.

Docs: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/

## 4. Save the token as a private GitHub Actions secret

Open https://github.com/scottjazdzewski/wire-to-wire/settings/secrets/actions

Select **New repository secret**. First create `WTW_CLOUDFLARE_ACCOUNT_ID` with the exact copied account ID. Then click **New repository secret** again and fill in:

- Name: `WTW_D1_IMPORT_TOKEN`
- Secret: paste the Cloudflare token from Step 3
- Click **Add secret**.

Save the exact Cloudflare account ID as a second GitHub Actions repository secret: `WTW_CLOUDFLARE_ACCOUNT_ID`. In Cloudflare → Workers & Pages → Account Details, click **Copy** beside Account ID, or use Cloudflare search (`Ctrl+K`) → **Copy account ID**. The import workflow now uses that secret instead of a hardcoded ID.

## 5. Run the isolated import action (one-time initial import)

Open https://github.com/scottjazdzewski/wire-to-wire/actions

Select **WTW D1 historical import (manual, isolated)** in the left sidebar → **Run workflow**.

- **Branch:** `main`
- **Mode:** `import_to_WTW_D1`
- **Confirm database:** type exactly `wtw-canon-desk-db`
- Click **Run workflow**. Open the new run and inspect all checks.

The workflow tests the source, builds and verifies SQL locally, looks up exactly the named database, applies WTW-only schema migrations, **refuses to import if any WTW data is already present**, imports staged source history, and compares remote table counts, checksum and user-approved names. It never imports into Rail & Rye or Hockey Lab.

If it fails, open the failed GitHub Actions step and share **only the error message** (do not share tokens). If it fails after imports have started, the nonempty guard intentionally stops accidental reruns; the partial-import state must be inspected before a controlled resume or rollback.

## 6. Verify the live website

Log in to https://wire-to-wire.pages.dev/ after the import. Expected:

- The year selector should show the documented historical years (not just 1953–55).
- Horses, people, farms, year-level ownership/trainer/jockey links, stakes editions and top-three placings populate the historical desk.
- Horse profiles show available pedigree and season summaries. Missing details stay marked as unresolved, not fabricated.
- Corrections save only as **review proposals**. Accepting a proposal **does not** rewrite the Google Drive source canon.

**Data coverage warning:** This staged history is based on the H/S/E/P/B spreadsheets, not a comprehensive ledger of every ordinary race. The source has QA-pending records; import validation is not GOLD certification.
