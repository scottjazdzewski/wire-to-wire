# Wire to Wire — Ownership Logos: Master Drive & Production Registry

**CANONICAL APPROVED MASTER ARTWORK REPOSITORY (Google Drive):**  
https://drive.google.com/drive/folders/15wRW8620R8AD1e7W4Rg69Eog4n2qlT22  
Folder ID: `15wRW8620R8AD1e7W4Rg69Eog4n2qlT22` (folder is already named **APPROVED**).

**This is the location every ownership-logo generation and refinement window must use for approved originals and all approved game-size exports.** Do not move or duplicate the existing master collection. Do not create another unrelated ownership-logo Drive folder. Continue using its existing per-organization subfolder convention.

## Required upload structure

Create or reuse exactly one child folder **per approved logo/organization ID**:
`APPROVED_O000014_ARGOSY_BLOODSTOCK/` for organization `O-000014`, for example.

Inside that folder, keep:
- `O-000014_ARGOSY_BLOODSTOCK_ORIGINAL_APPROVED.png` — the highest-quality accepted artwork, unmodified.
- `O-000014_ARGOSY_BLOODSTOCK_256.png` — the **single required in-game production size**, exactly **256×256 PNG** and centered on an uncropped square canvas.
- `manifest.json` with exact `organization_id`, exact full organization name, approval status, source/version and the production asset reference.
- Existing optional 1024/512/128/64/32 archive exports and ZIPs may be preserved, but **do not produce or bundle six different in-game copies**. The installed game uses one 256-square image; the user interface scales that image for profiles and smaller owner chips. Do not stretch, zoom, mask, or repaint an approved mark.

Match **existing immutable IDs**; never match to an owner, farm, person, trainer, horse or track using a similar name. Keep work-in-progress/unapproved options out of the **APPROVED** root until selected. Existing batch/legacy folders remain preserved as sources; future individual logo approvals go in a unique ID-specific folder. Do not overwrite other approved organizations.

## Important: Drive collection != 37-organization 1999 live roster

The Google Drive APPROVED repository may include historical, archival and future-scale organization logos that are **not** among the 37 approved opening January 1999 organizations. Preserve such artwork in Drive but **do not activate new organizations** or attach the logo to a different ID to make it appear on the site. E.g., legacy archive names such as `O-000065 Santa Ventura Stud`, `O-000069 Blue Lantern Farm`, `O-000070 Little Fork Farm` and `O-000072 Maple Crown Stud` exist in Drive but are not currently in `public/data/wtw-1999-founding-directory-v1.json`'s 37 opening organization records. This is not a reason to delete the artwork or expand the game.

The live 1999 roster is authoritative:
`public/data/wtw-1999-founding-directory-v1.json` → `organizations[].id`.
`public/assets/office/founding-organization-logo-index.json` → `approvedOrganizationIds` and `organizations` mappings. There are 37 allowed founding IDs; always read the live manifest for its current approved-logo count, not a stale handoff snapshot. Existing legacy logos must not silently substitute for approved replacements.

## Website production copy — ONLY after artwork/identity verification

The public/next browser build is an **internal development preview**. The final commercial game is the **bundled offline Windows desktop EXE**, generated from the same GitHub repository; approved image assets must ship locally with the game, not be fetched from Cloudflare at play time.

1. Copy the approved image from the Drive per-ID folder into **`public/assets/office/founding-organization-logos/`**, using exact canonical ID as filename, e.g. `O-000014.png` — **one 256×256 PNG per active organization**. Preserve the corresponding original in Drive.
2. In `public/assets/office/founding-organization-logo-index.json`, replace/add exactly:
   `"organization:O-000014": "/assets/office/founding-organization-logos/O-000014.png"`
   ONLY if `O-000014` is one of the 37 `approvedOrganizationIds` AND the approved logo actually matches that organization's identity.
3. Verify the file exists, the image isn't clipped or distorted, and the same mark appears in Ownership, its associated Facility view, and horse-owner badges when the horse's actual `owner_organization_id` matches.
4. Update `ops/approved-visual-assets.lock.json` in the **same PR** as any approved image bytes added or replaced. Run existing 1999 tests and real Chromium browser/visual checks before merging; Windows installer/offline tests are separate release gates. The old `public/assets/office/organization-logo-index.json` with 108 historical organizations is **NOT** an admissible source for opening 1999 membership, ownership or facility creation.

**No logo import is permission to add personnel, horses, physical facilities, tracks, international tracks, contracts, ratings or other gameplay entities.**

## Single-size game export and rendering specification

- **Production file:** `public/assets/office/founding-organization-logos/O-<IMMUTABLE_ID>.png`, PNG 256×256 px. The approved high-resolution master stays in the per-ID Drive archive.
- **Profile hero:** one square image slot, **140×140 CSS px** on standard desktop and laptop widths (1536×864 / 1280×800), **125×125** at viewport widths <=1080 px, and **108×108** at <=740 px. The ONE canonical `public/next/next.css` controls it.
- **Smaller owner badges and directories:** CSS scales the SAME 256px production image. Do not add per-organization overrides or export lower-resolution files into the game.
- **Layout:** `object-fit:contain`, centered, no border or overlay invented by the renderer, and no cropping/distortion of user-approved artwork. A crest's internal white/black/translucent margins are part of its accepted design unless the user specifically authorizes a visual reframe.
- **Future artwork QA:** test the exact 256px production asset at profile size and tiny badge scale on both dark and identity-tinted interface backgrounds. Respect each logo's approved corners/background. Avoid unnecessary blank padding inside the art.
- **Identity and offline:** only match a canonical approved `O-...` ID; ship each image locally with the desktop app, never load the playable logo from a remote URL. Keep the exact Git blob locked in `ops/approved-visual-assets.lock.json`.
- **Save safety:** presentation-only; neither the image mapping nor its dimensions may mutate owner, farm, breeder, person, horse, or save identifiers.

## One-line instruction for all other production windows

> **WTW OWNER LOGOS — ONE PRODUCTION SIZE:** Keep the accepted original master and **one 256×256 PNG** under the exact immutable organization-ID folder in the existing approved Drive archive: https://drive.google.com/drive/folders/15wRW8620R8AD1e7W4Rg69Eog4n2qlT22. The desktop game bundles only `public/assets/office/founding-organization-logos/O-<ID>.png`; its shared CSS handles all display sizes. Additional old archive exports may remain but do not enter the playable game. Map only exact-approved 1999 IDs in the founding manifest and update the visual-asset lock in the same PR. Keep gameplay, saves and UI unchanged.
