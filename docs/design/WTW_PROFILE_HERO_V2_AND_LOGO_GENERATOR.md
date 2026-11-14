# WIRE TO WIRE — PROFILE HERO V2 / IMAGE PRODUCTION HANDOFF
Date: 2026-11-13
Status: Production UI; new transparent hero marks auto-discover from their exact-ID paths on page refresh. Media generation is handled in a separate window.

## Scope
- Profile heroes for tracks, owners, racing stables, farms and stud farms share one layout.
- The existing approved Track Profile BADGE is the small left icon.
- The approved **farm/stable category badge** is the small left icon on stable, farm and ownership profiles; the actual unique organization mark is reserved for the right hero, preventing duplicate logos.
- The HERO logo is the distinctive right mark. No cream plaque or forced rectangle.
- The title and four identity facts must remain readable, with action buttons below them.
- The redundant horizontal menu strip is hidden globally; the department navigation and local VIEW selector continue to work.
- Horse and personnel **dossiers** retain their local Overview/History/MORE RECORDS controls. Their global breadcrumb uses a clean **HORSE PROFILE / [name]** or **PERSONNEL PROFILE / [name]**, never a percent-encoded route. At narrow widths the local dossier controls wrap without hiding functionality.
- Raw internal `WorldRecord:track%3A...` codes are never visible as the title on track/farm profiles.
- Page-specific identity palette remains intact. Background photographs **are not included**; a separate art window owns those.
- Deferred work item **#6**: deepen the entity palette into more panels/interactive elements after hero art is settled; do NOT silently do this in the present pass.

## Logo generator — exact asset contract
Create ONE high-quality hero mark for each track/organization. Real racecourses should use the authenticated existing identity with accurate lettering, emblems, proportions and colors; do not invent official-looking logos or change real track names. Fictional WTW venues can have new game-universe designs.

- **Master:** 1600 × 1200 px, 4:3, RGBA transparent PNG, sRGB.
- **Logo safety:** logo content centered inside x=120–1480, y=180–1020 (1360×840 safe area). No content touching canvas edges.
- **Optical fit handled by UI:** you do not need to manually crop the 1600×1200 master. On display, the UI measures the visible alpha pixels, retains an additional 6% safety halo, and uses a lossless temporary in-memory image so the logo looks large. Original PNG/WebP files are never modified.
- **Export:** **lossless alpha WebP** (transparent), same 1600×1200 canvas where feasible.
- **No baked-in white rectangle, colored square, plaque, gold frame, photographic backdrop, gradient, faux 3D wall, or drop shadow.** The UI supplies backdrop/lighting/glow.
- **Styling:** bold and legible from 280×140 down to roughly 190×95. Horizontal wordmarks must not include tiny letters. Vertical/crest marks must not be stretched.
- **Color:** preserve each existing real mark's authentic colors; don't recolor every track green/gold. For fictional venues use a distinct credible 2–4-color racing identity.
- **File name:** canonical Track_ID, e.g. `T-0001.webp`, `T-0017.webp`. For organizations, exact `O-000061.webp`.
- **Upload folder:** `public/assets/places/track-hero/` for track logos or `public/assets/places/organization-hero/` for organizations.
- **Activation:** upload a real **transparent lossless WebP** to the exact-ID path above, then refresh the site. The UI automatically detects and uses it; **no manifest edit is required**. The optional `public/assets/identity/hero-art-index-v1.json` is maintained for asset inventory only and must never connect the wrong ID to a logo.
- **Do not overwrite** `public/assets/places/track-logos/` originals, the Track Profile badge, frozen racing/source IDs, or unrelated art windows' files.

## Priority first batch
| ID | Place | Role |
| --- | --- | --- |
| T-0001 | Aqueduct | White-backed cyan wordmark, good matte pilot |
| T-0017 | Gulfstream Park | White-backed dark wordmark, use contrast-aware stage |
| T-0013 | Churchill Downs | White-backed horizontal wordmark |
| T-0002 | Belmont Park | Green branded field; needs a genuinely isolated silhouette |
| T-0003 | Saratoga | Historic track identity |
| T-0028 | Santa Anita | Major West Coast track |
| T-0014 | Keeneland | Major Kentucky track |
| T-0030 | Del Mar | Major West Coast track |
| T-0094 | Sweetwater Park | Fictional WTW expansion; high-quality new game brand |

## Profile pages without a logo yet
- All canonical track, racing stable, ownership, stud farm, and other facility profiles now reserve a consistent identity area in the right-hand hero, even when there was **no source image element** in the underlying page.
- Until a real logo is assigned, this area shows an elegant **typographic monogram derived solely from the visible entity name**, plus an accurate category label. This is explicitly a WTW temporary presentation—not a historical or official crest.
- As soon as the generator uploads the correct transparent file under `track-hero/T-####.webp` or `organization-hero/O-....webp`, the asset is automatically recognized on a refreshed page and the placeholder disappears.
- Images that fail decoding do not erase their existing logo or the source record.
- No duplicate or invented horse ownership, barn address, racing status, or brand colors are added by this treatment.

## Transparent logo optical fitting
- Transparent PNG/WebP artwork is display-cropped by its visible alpha bounds **only in the browser**. This corrects the mismatch between the 4:3 export canvas and the wider hero slot without stretching, distorting, or overwriting artwork.
- Bounding includes a small safety margin to keep every letter, silhouette and crest edge intact. Full-bleed or insufficiently visible images are left unchanged.
- Very dark wordmarks retain an independent soft contrast backlight. This is part of the UI, not baked into generated logos.
- Files are activated by canonical ID exactly as before; logo generation and photography remain in separate windows.

## Existing logo fallback
The UI's `profile-hero-v2.mjs` has a conservative, browser-only white-matte cleanup for **edge-connected white backgrounds** on legacy logo files, plus adaptive contrast for dark navy lettering. Original repository files are unchanged. New transparent artwork automatically takes precedence by the exact canonical-ID file path; its pixels are never altered. This is not a replacement for real logo production.

## QA acceptance gates
1. At 1440×900, 1280×720, and 1024×768, full **Location, Surfaces, Operating, Circuit** values are visible; allow natural wrapping, never ellipses.
2. Logo has independent right column; text and buttons do not collide, overlap or disappear.
3. White-backed Aqueduct/Gulfstream wordmarks have no beige frame; where legacy white matte cleanup fails, display the original image safely rather than a broken logo.
4. Track badge remains the left small icon. Right hero is not a duplicate plaque.
5. Only **TRACK PROFILE / Aqueduct** (etc.) appears in the global context. No raw `WorldRecord:...` strings and no `CURRENT OFFICE` breadcrumb.
6. The horizontal Overview/1999 Horses/People/Organizations/Tracks bar is gone wherever it appeared; the existing sidebar and dropdown navigation remain.
7. Owners, racing stables, farms and stud farms use the same hero structure, sourced organization identity, and responsive behavior.
8. Dark page theme and important injury/warning/Continue colors remain semantically consistent. No event/calendar/entry engine changes.
9. Layout and art pass mobile and signed-in Cloudflare preview. Automated checks alone do not certify visual polish.

## Files and architecture
- New `public/next/profile-hero-v2.css`: source-specific grid + identity hero stage + global redundant menu removal.
- New `public/next/profile-hero-v2.mjs`: route display cleanup + image manifest integration + conservative legacy white matte.
- `public/assets/identity/hero-art-index-v1.json`: optional exact-ID inventory, initially empty. Automatic ID-based file discovery works without entries.
- Updated `public/next/index.html`: loads CSS after the existing identity theme and JS after existing UI modules.
- `tests/profile-hero-v2.test.mjs`: layout and matte regression suite.
- Unchanged: `public/next/next.js`, `public/next/next.css`, game logic, source data, UI records, original asset files.
