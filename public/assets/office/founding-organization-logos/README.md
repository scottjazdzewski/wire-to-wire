# Wire to Wire — Ownership Logos: Master Drive & Production Registry

**CANONICAL APPROVED MASTER ARTWORK REPOSITORY (Google Drive):**  
https://drive.google.com/drive/folders/15wRW8620R8AD1e7W4Rg69Eog4n2qlT22  
Folder ID: `15wRW8620R8AD1e7W4Rg69Eog4n2qlT22` (folder is already named **APPROVED**).

**This is the location every ownership-logo generation and refinement window must use for approved originals and its ONE canonical 256px game export.** Do not move or duplicate the existing master collection. Do not create another unrelated ownership-logo Drive folder. Continue using its existing per-organization subfolder convention.

## Required upload structure

Create or reuse exactly one child folder **per approved logo/organization ID**:
`APPROVED_O000014_ARGOSY_BLOODSTOCK/` for organization `O-000014`, for example.

Inside that folder, keep:
- `O-000014_ARGOSY_BLOODSTOCK_ORIGINAL_APPROVED.png` — highest-quality accepted source, retaining its approved design and transparent background where applicable.
- **Required single game output:** `O-000014_ARGOSY_BLOODSTOCK_256.png` — exact 256×256 opaque RGB PNG with the same rounded corners and border line as every other approved logo. Any older 1024/512/128/64/32 exports stay archival only; the installed game does not need them.
- `manifest.json` with exact `organization_id`, exact full organization name, approval status, source/version and references to exported assets.
- Optional convenience ZIP containing the *same* approved files.

Match **existing immutable IDs**; never match to an owner, farm, person, trainer, horse or track using a similar name. Keep work-in-progress/unapproved options out of the **APPROVED** root until selected. Existing batch/legacy folders remain preserved as sources; future individual logo approvals go in a unique ID-specific folder. Do not overwrite other approved organizations.

## Important: Drive collection != 37-organization 1999 live roster

The Google Drive APPROVED repository may include historical, archival and future-scale organization logos that are **not** among the 37 approved opening January 1999 organizations. Preserve such artwork in Drive but **do not activate new organizations** or attach the logo to a different ID to make it appear on the site. E.g., legacy archive names such as `O-000065 Santa Ventura Stud`, `O-000069 Blue Lantern Farm`, `O-000070 Little Fork Farm` and `O-000072 Maple Crown Stud` exist in Drive but are not currently in `public/data/wtw-1999-founding-directory-v1.json`'s 37 opening organization records. This is not a reason to delete the artwork or expand the game.

The live 1999 roster is authoritative:
`public/data/wtw-1999-founding-directory-v1.json` → `organizations[].id`.
`public/assets/office/founding-organization-logo-index.json` → `approvedOrganizationIds` and `organizations` mappings. There are 37 allowed IDs; check the live logo manifest for its current approved count rather than a stale handoff number. Existing legacy logos must not silently substitute for approved replacements.

## Desktop game production copy — ONLY after artwork/identity verification

The playable game is the bundled, offline Windows desktop application developed in `scottjazdzewski/wire-to-wire`, branch `main`. The website is an internal preview, not the customer game runtime.

1. Copy the approved image from the Drive per-ID folder into **`public/assets/office/founding-organization-logos/`**, using the exact canonical ID as filename, e.g. `O-000014.png`; only ONE 256×256 PNG belongs in playable assets. Preserve the corresponding original in Drive.
2. In `public/assets/office/founding-organization-logo-index.json`, replace/add exactly:
   `"organization:O-000014": "/assets/office/founding-organization-logos/O-000014.png"`
   ONLY if `O-000014` is one of the 37 `approvedOrganizationIds` AND the approved logo actually matches that organization's identity.
3. Verify the file exists, the image isn't clipped or distorted, and the same mark appears in Ownership, its associated Facility view, and horse-owner badges when the horse's actual `owner_organization_id` matches.
4. Update `ops/approved-visual-assets.lock.json` in the same PR for every changed asset, check the border against the locked production standard and test browser and desktop/local asset loading before release. Browser tests alone are NOT Windows desktop certification. The old `public/assets/office/organization-logo-index.json` with 108 historical organizations is **NOT** an admissible source for opening 1999 membership, ownership or facility creation.

**No logo import is permission to add personnel, horses, physical facilities, tracks, international tracks, contracts, ratings or other gameplay entities.**

## One permanent physical logo frame standard

Every owner, farm, stud and stable logo in the playable world uses the same **256×256 opaque RGB PNG**, **28px rounded corner radius**, **5px warm-ivory border #F4EDDE**, inset **5px**, with external near-black corner pixels `#060709`. The border is physically included in the production PNG, never invented at runtime with CSS. No per-company override or separate 64/128/512px in-game assets. Continue using exact organization ID file paths, one local source of truth and the preserved high-resolution original Drive master. See [the complete production contract](../../../../docs/branding/OWNER_LOGO_PRODUCTION_STANDARD.md) and `scripts/normalize_owner_logo_art.py`.

## One-line instruction for all other production windows

> **WTW OWNER LOGOS — FIX THE ARTWORK, NOT THE UI:** Keep the approved original master under its existing Drive exact-ID folder, generate **one 256×256 RGB PNG** with the same **28px rounded corners** and **5px #F4EDDE border inset 5px**, and ship only `public/assets/office/founding-organization-logos/O-<ID>.png` by immutable approved ID. The local desktop game uses that one file across every profile. Check optical margins at game size, protect old source art and update exact SHA lock in the same PR. Never create another interface or use Cloudflare for local logos.
