# Wire to Wire — Ownership Logos: Master Drive & Production Registry

**CANONICAL APPROVED MASTER ARTWORK REPOSITORY (Google Drive):**  
https://drive.google.com/drive/folders/15wRW8620R8AD1e7W4Rg69Eog4n2qlT22  
Folder ID: `15wRW8620R8AD1e7W4Rg69Eog4n2qlT22` (folder is already named **APPROVED**).

**This is the location every ownership-logo generation and refinement window must use for approved originals and all approved game-size exports.** Do not move or duplicate the existing master collection. Do not create another unrelated ownership-logo Drive folder. Continue using its existing per-organization subfolder convention.

## Required upload structure

Create or reuse exactly one child folder **per approved logo/organization ID**:
`APPROVED_O000014_ARGOSY_BLOODSTOCK/` for organization `O-000014`, for example.

Inside that folder, keep:
- `O-000014_ARGOSY_BLOODSTOCK_ORIGINAL_APPROVED.png` — highest-quality accepted source, retaining its approved design and transparent background where applicable.
- Size-specific exports `O-000014_ARGOSY_BLOODSTOCK_1024.png`, `_512.png`, `_256.png`, `_128.png`, `_64.png`, `_32.png` (no stretching, loss of crest edges or unapproved redraws).
- `manifest.json` with exact `organization_id`, exact full organization name, approval status, source/version and references to exported assets.
- Optional convenience ZIP containing the *same* approved files.

Match **existing immutable IDs**; never match to an owner, farm, person, trainer, horse or track using a similar name. Keep work-in-progress/unapproved options out of the **APPROVED** root until selected. Existing batch/legacy folders remain preserved as sources; future individual logo approvals go in a unique ID-specific folder. Do not overwrite other approved organizations.

## Important: Drive collection != 37-organization 1999 live roster

The Google Drive APPROVED repository may include historical, archival and future-scale organization logos that are **not** among the 37 approved opening January 1999 organizations. Preserve such artwork in Drive but **do not activate new organizations** or attach the logo to a different ID to make it appear on the site. E.g., legacy archive names such as `O-000065 Santa Ventura Stud`, `O-000069 Blue Lantern Farm`, `O-000070 Little Fork Farm` and `O-000072 Maple Crown Stud` exist in Drive but are not currently in `public/data/wtw-1999-founding-directory-v1.json`'s 37 opening organization records. This is not a reason to delete the artwork or expand the game.

The live 1999 roster is authoritative:
`public/data/wtw-1999-founding-directory-v1.json` → `organizations[].id`.
`public/assets/office/founding-organization-logo-index.json` → `approvedOrganizationIds` and `organizations` mappings. There are 37 allowed IDs, and 17 existing website logos were mapped by verified exact ID/name before the Drive export handoff. Existing legacy logos must not silently substitute for approved replacements.

## Website production copy — ONLY after artwork/identity verification

The website is deployed from `scottjazdzewski/wire-to-wire`, branch `main`.

1. Copy the approved image from the Drive per-ID folder into **`public/assets/office/founding-organization-logos/`**, using exact canonical ID as filename, e.g. `O-000014.png` (and optional derivative sizes if needed). Preserve the corresponding original in Drive.
2. In `public/assets/office/founding-organization-logo-index.json`, replace/add exactly:
   `"organization:O-000014": "/assets/office/founding-organization-logos/O-000014.png"`
   ONLY if `O-000014` is one of the 37 `approvedOrganizationIds` AND the approved logo actually matches that organization's identity.
3. Verify the file exists, the image isn't clipped or distorted, and the same mark appears in Ownership, its associated Facility view, and horse-owner badges when the horse's actual `owner_organization_id` matches.
4. Run existing 1999 tests and browser/visual checks and confirm deployment. The old `public/assets/office/organization-logo-index.json` with 108 historical organizations is **NOT** an admissible source for opening 1999 membership, ownership or facility creation.

**No logo import is permission to add personnel, horses, physical facilities, tracks, international tracks, contracts, ratings or other gameplay entities.**

## One-line instruction for all other production windows

> **WTW OWNER LOGOS — CANONICAL DROP:** Put all user-approved ownership logo masters, transparent PNG exports at 1024/512/256/128/64/32 and a `manifest.json` in an exact-ID subfolder of `https://drive.google.com/drive/folders/15wRW8620R8AD1e7W4Rg69Eog4n2qlT22` (Google Drive **APPROVED**). Example: `APPROVED_O000014_ARGOSY_BLOODSTOCK/`. Do not create a parallel Drive repository or rename an identity. Site integration goes to GitHub `scottjazdzewski/wire-to-wire` → `public/assets/office/founding-organization-logos/` and `public/assets/office/founding-organization-logo-index.json` by exact `O-...` ID, **only for the 37 founding organizations**. Historical/out-of-roster logos remain archived, not live.
