# Approved track logos — pending permanent track IDs

These two original, owner-approved logos are true-transparent 1600×1200 lossless WebP files, verified pixel-identical to their approved PNGs:
- `bluff-city-downs.webp`: Bluff City Downs, Memphis / Collierville, TN — Memphis riverbend monogram (no horse).
- `lowcountry-racecourse.webp`: Lowcountry Racecourse, Charleston / Johns Island, SC — elegant palmetto, no city/state text.

They are bundled and exact-Git-blob locked in `ops/approved-visual-assets.lock.json`, but **not mapped to track hero IDs yet**. The canonical 1999 racing registry does not currently contain these new venues. Do not reuse existing T-IDs or infer IDs. When the world/data workstream creates immutable IDs, move/rename the files to `public/assets/places/track-hero/T-NNNN.webp`, update the hero-art-index and lock atomically, and test visual use in the Windows EXE. Preserve saved games and player art overrides; do not substitute rejected previous designs.
