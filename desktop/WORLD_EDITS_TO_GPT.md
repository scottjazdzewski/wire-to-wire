# Wire to Wire — Edit in the EXE, review with GPT, publish approved changes

## Available today in the EXISTING Windows executable

1. Open Wire to Wire and select **World**.
2. Find a horse/person/farm/track and open **EDIT RECORD**.
3. Save changed fields and upload a photo/logo if desired.
4. Click **EXPORT EDITS** in the World toolbar (or **EXPORT BACKUP** from an open record editor).
5. The EXE downloads `wire-to-wire-world-edits.json`. This contains the `WTW_WORLD_USER_EDITS_V1` dictionary of per-ID changed fields and user image data URLs.
6. Attach that exact JSON file in the designated World Integration WORK chat. Ask it to **review a diff by canonical ID, check approved identities and pedigree references, apply only explicitly accepted modifications to the fictional 1999 base in an isolated branch, run the project-wide tests, and merge**. The existing Windows workflow later publishes a newly tested EXE on the same permanent download URL.

**NEW convenience after this PR is merged AND a newer EXE is published:** Save/Load's **EXPORT WORLD EDITS FOR GPT** invokes the same existing export method. The World toolbar export works in older EXEs and does not need this new convenience to begin.

## Why there are two different exports

- World Edits JSON: local World Editor changes, including pictures, in source-record keyed patches. Needed when asking engineering to promote approved changes into the canonical **starting world in the NEXT EXE**.
- `.wtwsave`: compact current career and recorded gameplay state. It does **not yet** include all World Editor overlays or custom pictures. Back up both before changing EXEs, switching devices, or deleting profile storage.
- For the same Windows user profile, changing portable EXE binaries generally keeps the Electron `wtw://game` profile, so local editor overlays remain there. This is not a guaranteed migration/portable career archive. Do not clear application data or browser storage; never assume copying the EXE alone transfers saves/images.
- **Custom World Template** remains planned and not yet shipped; current JSON is an intermediary source patch export, not a full complete world template.

## Suggested WORK-tab request

> I edited my Wire to Wire 1999 fictional universe in the desktop game. Please inspect the attached `wire-to-wire-world-edits.json`. Produce a human-readable ID-by-ID change summary and show me which changes can safely become approved default fictional-world data. Preserve approved immutable IDs, historical fictional pedigrees, existing entity links, and the asset byte locks. Do not admit unapproved proposal entities or overwrite current player saves. Convert the reviewed edits and images into a dedicated GitHub PR on the latest main, run all required desktop/source/asset/UI tests, and merge only if checks pass. Then give me the exact new release / latest EXE when Windows packaging publishes it. Do not claim display-only edits change the gameplay engine unless tested.

## Engineering boundaries

The JSON export is user-origin data, NOT automatically trusted source content or a directly executable patch. Do not apply arbitrary user JSON to code or accept malformed/unrecognized entity references. The source commit may have moved after export: reconcile stable IDs, show conflicts and decide field-by-field.

Binary images embedded as `data:image/png/jpeg/webp;base64,` must be checked for format, dimensions, and actual asset identity. For official images create files under the correct approved assets location and update `ops/approved-visual-assets.lock.json` together in the **same** approved PR as mandated by `AGENTS.md`; do not overwrite the lock as a shortcut. Do not add real-person copyrighted assets without authorization.

A ChatGPT work window that is given the exported JSON can perform source changes using the GitHub connector and review gates; the Windows game does not contain GitHub credentials or perform code pushes. Do not assume that a branch/PR update automatically rebuilds the latest downloadable EXE: the release must be a **successful main-based Windows workflow**.

**Follow-on system requirement:** #213 proper versioned world patch and promotion; #189 durable per-career editing and media backup; #185 fully operating 1999 fictional genesis.
