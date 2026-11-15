# WIRE TO WIRE — LOGO-FIRST IDENTITY AND PROFILE DEPTH v3
**Scope:** canonical FM/OOTP desktop UI only. **Status:** proposed visual review; not a production acceptance or a claim that logo colors were manually authenticated.
**Supersedes:** the arbitrary art-direction palette approach in `WTW_ENTITY_IDENTITY_THEMES_V1.md`.

## Locked design decision
Every identity color on a track, racing stable, ownership group or farm profile MUST be derived from the actual displayed logo pixels of the matching immutable T-/O-identity. Never invent brand colors from names, category, region, other organizations, a designer's idea of what suits a racetrack, or a deterministic hash. Santa Anita is **not** assigned burgundy. No other track receives an imposed color.

The approved logo files remain untouched: `public/assets/places/track-hero/T-####.webp`, approved track-logo fallbacks, and `public/assets/office/founding-organization-logos/O-....png`. Display-only optical cropping or white-matte removal in `profile-hero-v2.mjs` may be used; never alter source artwork or its approved asset lock.

## Execution
- `identity-themes.mjs` identifies the canonical profile, finds its actual displayed logo in the protected right-hand hero, samples its visible chromatic pixels using a 160-pixel bounded offscreen canvas, and extracts primary/secondary color from real source pixels.
- White/gray mattes, near-black lettering, transparent padding and low-opacity edges cannot be selected as brand colors. Source selection is restricted to exact-ID approved paths, the approved logo hero's in-memory optical derivative, and a displayed player-uploaded replacement.
- Theme activation requires `data-wtw-logo-theme="ready"` and `data-wtw-identity-source="logo-pixels"`. If an approved logo is absent, monochrome, unreadable or cross-origin blocked, **keep the neutral charcoal profile**. Never fall back to a designer palette.
- The first color governs concentrated identity highlights and rich tonal surfaces. The second is another existing logo pixel; if none is significant, use the first. Deep tints are computed by mixing the logo hue with the app's neutral charcoal; white text and safety-state colors remain platform semantic.
- No gameplay, ratings, chronology, world-data identities, save namespaces, page geometry, navigation, or logo files are changed.

## Actual visual design
1. Preserve the existing original profile geometry: category badge left, exact venue or organization logo on the right, readable name and factual metadata, visible controls.
2. Increase hero presence using a very restrained logo-hued radial light, neutral dark gradient, rim highlight and soft shadow. Do not increase its height or steal the stakes table's room.
3. Establish three visual layers: recessed app canvas, content panels with small elevation, and high-attention hero. Neutral depth also works for identities without artwork.
4. Apply logo-sourced accents to selected navigation/tabs and compact management-panel/table headings. Keep 70%+ of the management workspace neutral for dense scanning.
5. The track profile **always** retains full sortable Major Races & Stakes left, Meet & Conditions right above Track History. No collapsed lists, no pilot menus, no new panels or extra scrolling.
6. Motion effects, when present, are small and disabled in reduced-motion settings.

## Verification gates
- Unit tests create sample pixel arrays and prove observed emerald and gold pixels yield **those exact pixels**; transparent or monochrome images yield no brand palette.
- Verify three actual logo-driven track profiles (Aqueduct, Belmont, Gulfstream) and an approved farm in Chromium. No hardcoded expected color hex; instead inspect the logo pixel source, computed theme source, and rendered screenshot.
- Verify the default Office remains brand-neutral after leaving each profile, and unknown/unmatched organization identities remain neutral.
- Visually inspect 1536×864 and 1280×800 for logo legibility, panel separation, stakes sort, full source facts, no clipping, and appropriate degree of depth. Inspect images rather than trusting green CI alone.
- The change remains in a **separate review branch / PR** until full tests and human screenshots are signed off.

## Ownership
This is a UI presentation-only workstream. It may not modify the asset files or the world/season/career logic. All other engineering windows should preserve this logo-first color contract and avoid reintroducing static brand color maps.
