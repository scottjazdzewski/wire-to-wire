# WTW NEXT v5 — Racing Office visual composition
Status: review site /next/, main live homepage unchanged.
Date: 2026-11-10

## Visual changes
- One full-bleed editorial decision feature with actual previously approved generic racing photograph behind a readable dark information scrim. The photo is explicitly labelled as a reference photograph, not the selected horse.
- Replaced four separate Intelligence tiles with a vertically organized four-read analyst feed, each carrying its own restrained source color.
- Replaced boxed decision choices with compact numbered management rows and larger readable decision names.
- Sharpened the permanent Inbox, six-horse Stable Roster, and three-race Schedule into professional table-like presentations, rather than green bordered widgets.
- Tightened and aligned global navigation, in-world date, actions, and context subnavigation with a quieter dark-forest/charcoal palette.
- Reserved all original interactive data attributes and canonical state. Existing source-controlled v4 decision queue and resolved-result layout are unchanged.
- Still exactly ONE active stylesheet: public/next/next.css. No additional CSS link or alternate state store.

## Local Chromium render QA
Actual browser rendering of the previous working build plus identical v5 CSS composition at 1366x768, 1280x800, 1150x720 and 1093x614. Each rendered all 6 horses, 3 race targets, 4 Intel reads, 3 decision choices with no document-level overflow. Screenshots in local review workspace (not separately deployed).
Clicking the first decision in the legacy v3 preview updated saved case state and stable status. That older local v3 inline preview does not include newer v4 result-rendering logic; v4 result flow is preserved unchanged and checked by existing repository tests. Browser Cloudflare-origin Save/Load still needs a hosted test.

## Honest scope
This is a meaningful Office visual direction pass, not a claim of finished Football Manager or OOTP visual parity. The historical simulation remains the existing 2014 Office prototype, not a playable certified 1999 season. No fake racing results, horses or finances were added. Main game site and historical archive untouched.
