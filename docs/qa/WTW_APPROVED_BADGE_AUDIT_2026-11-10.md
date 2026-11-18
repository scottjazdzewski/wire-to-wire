# WTW Approved Badges — Asset Integrity + Readability Audit (v7)
Date: 2026-11-10 | Active main site and /next/ share `public/next/next.css` and `public/next/next.js`.

## Sources and source integrity
The Drive v2 manifest marks all twelve no-text 512×512 transparent green/gold badge PNGs **APPROVED CURRENT**. Compared every actual original local PNG's Git-object SHA against GitHub `public/assets/profile-badges/v2/`; **12/12 byte-for-byte identical**. The obsolete v1 profile badge files are absent. Approved logo and originals remain unchanged.

## Display problem and correction
Transparent margins in approved PNGs consume approximately 42% of each image's nominal width. At the previous 25px site header image size, a shield was only about 15px wide and looked less legible. This was display sizing, not low source quality.

Updated the single existing visual system:
- Office section headers use a 32×40px visible shield viewport with the original 512px image rendered at 46px *inside* the viewport. The visible shield width is approximately 27px; no original pixels are altered. Flex centering is essential: grid centering was initially tested and found to cut off the right edge; corrected before release.
- Full-page section headers use a larger 44×54px viewport, and asset profile identity shields receive a larger visible presentation while remaining inside their allocated profile header.
- The path helper accepts only the 12 approved kind names, with a source-approved history badge as the deterministic fallback rather than constructing a nonexistent filename.
- Image load errors are captured and show a visible warning placeholder instead of an invisible/broken-image hole. Browser console identifies which original URL failed. The presentation never silently substitutes made-up art.
- No alternate badge art, new PNG, second CSS file, source history change, or game-state change introduced.

## Testing
Chromium local self-contained page (approved images injected as data URIs) at 1366×768, 1150×720, 1093×614:
- **2/2 Office badge images loaded and displayed at 46 CSS pixels** in 32×40px frames.
- Horse Profile badge loaded in dedicated identity frame; all six stable horses and three race rows still present.
- No page-level overflow, heading text overflow or JavaScript errors.
- Source visual check caught and corrected a right-side shield clip caused by CSS grid intrinsic track sizing. Changed to centered flex frame and re-rendered.
- New automated Node regression checks all twelve PNG files' dimensions, RGBA format and immutable Git blob hashes, plus route/header badge component presence and single-stylesheet contract.

## Limitations
Cloudflare Pages' authenticated real-origin image responses could not be fetched from this environment. **Do not claim live CDN image loading has been independently validated** until it is checked in the browser. Repository bytes, paths and local browser image loading are verified; deployed image responses remain a separate acceptance gate.
