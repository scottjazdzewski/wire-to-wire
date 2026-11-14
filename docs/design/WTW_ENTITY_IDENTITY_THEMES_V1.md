# WIRE TO WIRE — Entity Identity Theme System v1

## Purpose
Give every canonical racetrack and organization profile a distinct sports-management atmosphere without changing the game state or redesigning the Office. This is a design-system layer, not a new source of historical truth.

## Production behavior
- Every recognized **Track Profile** and **1999 track world record** resolves by permanent `T-####` ID.
- Every recognized **ownership group / racing stable / farm profile** resolves by permanent `O-...` ID, whether opened as a founding organization or as a world directory record.
- The three approved pilot track routes are Belmont Park (`T-0002`), Churchill Downs (`T-0013`) and Gulfstream Park (`T-0017`).
- Additional examples: Saratoga (`T-0003`), fictional Sweetwater Park (`T-0094`), Wetherby Plain, Harrowgate Farm, St. Alloy Partners, Kingsmere and Crescent Mile.
- Every other recognized track/organization gets an ID-stable, deterministic WTW **house palette**, not a purported official team color. All can later be upgraded simply by entering an approved four-color palette in `public/assets/identity/visual-themes-v1.json`. Never infer official colors from a name.
- The selected identity colors the **top/header context, left navigation selection, profile hero, active tabs, and management card headers**. Essential warnings, health states, racing form, tables, and Continue stay semantically stable.
- The already-approved **Track Profile badge** occupies the left profile badge, while the real track logo remains in its existing larger image frame on the right. Replacing opaque-background logos with transparent artwork is a separate **asset production** task, not a CSS filter or an unlicensed redraw.
- Unrecognized/preview/non-entity routes retain the normal WTW identity and default palette.

## Files
- `public/assets/identity/visual-themes-v1.json`: visual palette overrides. Artwork direction proposals only, not verified official branding.
- `public/next/identity-themes.mjs`: route- and ID-scoped resolver, with strict color validation and safe fallbacks.
- `public/next/identity-themes.css`: scoped cosmetic styling loaded after the existing CSS.
- `public/next/index.html`: adds **two** external asset references. No game JS overwritten.

## Scope and safety
No source/canon edits, new entities, new rating fields, save-schema changes, roster modifications, UI geometry changes, or database writes. No changes to the base `next.js` or `next.css` that parallel production windows edit.

## Acceptance / human visual review before merge
1. Belmont, Churchill and Gulfstream should have visibly distinct header and navigation accents.
2. Track badge on left, original large track identity artwork on right, with full text/logo visible; no cropping or logo substitution.
3. Wetherby Plain, Harrowgate Farm, and Kingsmere Farm should each show different palettes; ownership and facility routes for the same O-ID must match.
4. Confirm switching Track → Office clears the theme; back navigation reapplies it.
5. Confirm uncurated track IDs and organization IDs use stable house palettes, with no palette drift between visits.
6. Verify at 1440×900, 1280×720, and narrow display; text contrast, hover/focus, overflow, tabs, and logo artwork.
7. Run `node --test tests/identity-themes.test.mjs`.
8. Review under the Cloudflare Pages CSP and actual access-gated preview. Automated tests are not a substitute for the three visual comparisons.

## Next phase
Curate per-entity visual palettes from approved source logos, add transparent PNG/WebP derivatives for the right identity artwork, then tie the player Office and Horse Profile identity to **canonical owner/stable IDs**. Do not manufacture ownership links or apply theme colors as facts about historical logos.
