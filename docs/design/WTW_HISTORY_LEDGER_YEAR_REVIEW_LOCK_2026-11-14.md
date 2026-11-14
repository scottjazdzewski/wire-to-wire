# WIRE TO WIRE — HISTORY LEDGER + YEAR IN REVIEW (PERMANENT UI CONTRACT)
2026-11-14 · Scoped to existing historical read model at `/archive/`. User-approved direction: *History is primarily one big sortable information screen, with each individual year opening a season review.*

## One main History records workspace

- Entering `/archive/` or `/archive/?page=races` opens the **History Records** ledger, not an obsolete Command Center or a month-card carousel.
- The central workspace is **one full-width, independently scrollable, dense table** of all **loaded and active** race editions, not a monthly stack of cards. Full-source sorting and filtering occur **before** 75-row display pagination. Keep persistent headings and compact navigation.
- Columns: **YEAR · DATE · RACE · RACECOURSE · WINNER · DATE EVIDENCE**. Column headings toggle ASC/DESC with visible arrows and `aria-sort`. Dates that are missing remain missing (end of either sort direction), not fictionalized to look complete.
- Filters: all years or a chosen year, all racecourses or a chosen racecourse, and search by race name, track, winner name, horse ID, season or edition ID. The source links retain their exact immutable IDs after sorting.
- Click any year to open its Year in Review; click a race or horse to open the existing historical record drawer. Do not create new names, simulated placements, phantom participants or separate database tables merely to fill the display.
- Source status: retain the existing `src/history-inactive-read-model.js` quarantine and source-approval gate. Year coverage cannot be mistaken for historical authentication. The demo fallback must remain plainly labeled as a sample, not commercial canon.

## Year in Review: one linked dossier per real recorded year

- Deep-link format: `/archive/?page=races&review=1953` (year varies); in-game year selection and browser Back must restore the complete History ledger.
- Compact annual performance strip: active edition count, recorded winners, distinct racecourses, **sourced exact dates**.
- Three **Classic Winners** records: Kentucky Derby, Preakness Stakes, Belmont Stakes. List actual recorded winning horse with its ID and racecourse/date evidence. If the edition or winner is absent, display an honest gap, not a fabricated winner.
- **Championships & Awards:** show entries only when a later explicitly source-approved awards read model provides year, category, named winner, immutable source ID, and verification status. **No current D1 awards ledger is connected, so the award section must show a source gap rather than infer Horse of the Year from a few major race wins.** Awards founded in later eras are not retroactively manufactured for earlier seasons.
- **Recorded Season Leaders:** rank by the number of active, recorded stakes-edition wins in the loaded ledger, labeled as **recorded wins**, not actual Horse of the Year, championships, statistical all-starts, trainer or jockey titles. A partial ledger means partial statistics.
- **Complete Year Results:** compact source-linked race table, real dates only, and the same date-evidence treatment as the all-years ledger.
- Source-based year-only dating and schedule uncertainty remain explicit, especially before 1973. Don't assign exact race days where the source only supports a year.

## Permanent Year in Review visual identity — racing annual, NOT flat olive green

The main History Records screen remains a sober, dense sortable database; **the individual Year in Review is intentionally a premium illustrated-editorial racing annual** with the information hierarchy and visual character of a professional FM/OOTP annual season report.

- **Masthead:** deep racing ink/navy, burgundy/wine-red, cream and brass-gold layered gradients, an oversized ghost year and subtle racing-line texture; prominent serif annual title, compact functional year dropdown and return control. No filler hero larger than needed.
- **Genuine metrics:** four compact but visibly distinct annual-stat tiles, each sourced from the active season edition ledger. No invented winners, awards or fake live events.
- **Three Classics:** Blue-riband winner cards with distinctive navy/blue, racing burgundy/red and bronze/gold treatments, ordinal marks, prominent horse-record links, source venue/date footer. Missing winner data must stay plainly missing; a decorative card cannot imply a result.
- **Awards and season leaders:** plum/medal-toned awards treatment with source-gap wording until approved awards are supplied; steel-blue season leaderboard with linked horses; results table in compact ink blue with real scrolling and source-date evidence.
- **Never regress to monotonous flat olive-green panels.** Visual depth is earned through hierarchy, rich contrasting surfaces, distinct accent families, deliberate typography and approved imagery only when actually associated with the recorded entity; no false historical photographs or invented badges.
- Use one definitive set of annual CSS rules in `public/style.css`, scoped under `history-year-review` or the page's unique annual classes. Physical retirement is mandatory: do not append competing override stacks or resurrect old month-card styling.
- Retain the same semantic controls, URL/back behavior, horse links, source gating, readable focus indicators and independently scrollable results. Desktop screenshot acceptance at 1536×864 and 1280×800 must check contrast, clipping and density.

This is the approved permanent annual editorial design baseline. Future UX work may enrich verified season information inside this architecture but may not quietly replace it with generic olive dashboards.

## Existing application, not another game

This changes the existing `public/app.js`, `public/archive/index.html`, and `public/style.css` rather than adding a competing shell or historical master. The retired `vault-race-card` monthly presentation and its CSS are physically removed. The pure read-only model `public/archive/history-ledger-model.mjs` is the one new history view model; it owns neither source data nor gameplay commands.

The `/archive/` history site still has a separate older navigation shell and is a read-only historical reference route. Moving that D1-backed view to the unified `/next/` management shell remains a **separate guarded migration**: never delete the current historical API, source names/IDs, edit overlays or saved game dependencies before parity is verified. No historical engine/D1 writes are authorized by this UI milestone.

## Evidence & release gate

- `tests/history-ledger-year-review.test.mjs`: sorting in both directions, row filters, active-only visibility, immutable winner/source links, authentic classics, verified-award-only policy, and removal of old month-card UI.
- `scripts/history-ledger-browser-cdp.mjs`: actual Chromium ledger, sort, track filter, year review, browser Back, annual deep-link, and no invented awards using the **explicitly labeled local sample**, not a claim of source truth.
- `scripts/desktop-visual-audit.sh`: captures full ledger and the 1953 Year in Review at desktop resolution. Real human visual approval is still required for 1536×864 and 1280×800.
- All existing repository regression suites, source quarantine/historical canon audits, art locks, save/reopen and management screen audits remain in force.

**Default future development rule:** add future award and seasonal historical data through the established canonical history approval gate first; the History UI only reads certified source records and never invents or auto-promotes them.
