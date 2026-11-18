# WTW badge repair — isolated shields only
Date: 2026-11-10
The original v2 PNG files were *individual filenames* but NOT properly separated images. Several contain dark rectangular sheet backing, pieces of neighboring gold shields, and faint bleed-through. Existing source checks merely verified the bytes and had not caught the visual defects.

## Repair
- All 12 individual PNGs were repaired by isolating the center gold-and-green shield silhouette from the original file, masking everything outside it to alpha=0, and normalizing each on its own 512×512 fully transparent canvas.
- Approved interior symbols and distinctive gold/forest colorways were retained; no alternate artwork invented.
- Exactly one connected nontransparent shield region per output; no neighboring image fragments or background rectangle.
- The updated PNG files overwrite the previous corrupt v2 filenames for compatibility with all existing game routes. Previous originals remain recoverable in Git history at commit `7f1cc35c19f593c351507710d932d7dd383c44ea`.
- Single existing `/next/next.css` removes the separate dark/bordered badge container. Active JS requests use `?shield=20261110` to bypass stale browser caches.
- The original v2 approval described intended shield designs, not permission to include background spill. Repaired assets are user-requested derivatives, with both old and new hashes recorded in the repository manifest.
- PNG integrity/asset hash check updated to the corrected binaries. Canonical game state, routes, 1999 sources, logo, and /archive unchanged.

## Visual QA
- Rendered contact sheet on a visible checkerboard confirms 12 independent single-shield alpha cutouts.
- Automated local PNG testing verified each is 512×512 RGBA with one substantial visible component and transparent corner pixels.
- Final acceptance requires confirming Cloudflare serves corrected images in Horse and Race profile headers; GitHub passing tests alone do not prove CDN availability.
