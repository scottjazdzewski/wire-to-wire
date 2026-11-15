# WIRE TO WIRE — SINGLE LOGO PRODUCTION STANDARD

**Authority:** all approved racing owners, farms, studs and stables. **Scope:** artwork, not UI redesign. Commercial game uses the *existing*, locally bundled 1999 management interface and the same immutable organization IDs.

## What every production logo must look like

| Property | Exact production value |
| --- | --- |
| Output file | `public/assets/office/founding-organization-logos/O-<ID>.png` |
| Dimensions | 256×256 pixels, 1:1, RGB PNG (opaque) |
| Corners | Identical rounded rectangle, 28px radius, black/navy-black external corners `#060709` |
| Border | **Every** mark: 5px line, same warm ivory `#F4EDDE`, inset 5px |
| Placement | Entire approved emblem readable inside this fixed 256×256 frame; no arbitrary per-brand zoom or stretching |
| Style | No new horse/letters/text/shadows/shiny gradients; retain approved original identity |
| Source master | Original accepted high-resolution artwork kept in existing exact-ID Google Drive APPROVED folder |
| Game | ONE 256px canonical PNG per organization, reused at all rendered UI sizes |

The rounded corners and **border are part of the produced image**, **not CSS decorations**. Keep the game UI unchanged. All brands use one border geometry and color regardless of whether the original proof had gold, red, white, thick or absent framing. Batch correction removes only connected exterior old border ink when safely distinguishable from the field, then adds the same new border. It must not redraw the inner approved logo art.

### Production implementation

`scripts/normalize_owner_logo_art.py` is a deterministic PIL pipeline. For the initial 31-logo conversion, it reads source PNG bytes from **immutable git commit `7ed6774c8bc4fa660f382251d74bac3e8993bb23`**, so repeat runs do not compound the edit. Originals remain recoverable in Git history and Drive. A same-PR visual lock is required. The build-time script and Pillow are NOT player runtime dependencies.

During one-time migration, PR CI produces a before/after QA contact sheet of every exact-ID asset and writes only the authorized generated PNGs, the SHA-verified geometry audit, and the visual asset lock onto the PR branch. Compare all images visually before merge, specifically: Bellwether, Aurelian, Takimori, Split Rail, Crescent Mile, navy/ivory marks and compact wordmarks. Hold suspect logos for manual brand-safe correction, do not clip emblem strokes.

### Offline / save compatibility

Each 256px file ships in the Windows install's local static assets. There are no network calls for a logo. The original organization IDs and indexing paths remain unchanged. This has **no save format or gameplay impact**. The packaged Windows EXE and its fully offline install/reopen verification belong to the dedicated desktop release workstream. **NOT YET DESKTOP CERTIFIED** until that actual test is recorded.