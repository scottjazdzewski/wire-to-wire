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

## Existing application, not another game

This changes the existing `public/app.js`, `public/archive/index.html`, and `public/style.css` rather than adding a competing shell or historical master. The retired `vault-race-card` monthly presentation and its CSS are physically removed. The pure read-only model `public/archive/history-ledger-model.mjs` is the one new history view model; it owns neither source data nor gameplay commands.

The `/archive/` history site still has a separate older navigation shell and is a read-only historical reference route. Moving that D1-backed view to the unified `/next/` management shell remains a **separate guarded migration**: never delete the current historical API, source names/IDs, edit overlays or saved game dependencies before parity is verified. No historical engine/D1 writes are authorized by this UI milestone.

## Evidence & release gate

- `tests/history-ledger-year-review.test.mjs`: sorting in both directions, row filters, active-only visibility, immutable winner/source links, authentic classics, verified-award-only policy, and removal of old month-card UI.
- `scripts/history-ledger-browser-cdp.mjs`: actual Chromium ledger, sort, track filter, year review, browser Back, annual deep-link, and no invented awards using the **explicitly labeled local sample**, not a claim of source truth.
- `scripts/desktop-visual-audit.sh`: captures full ledger and the 1953 Year in Review at desktop resolution. Real human visual approval is still required for 1536×864 and 1280×800.
- All existing repository regression suites, source quarantine/historical canon audits, art locks, save/reopen and management screen audits remain in force.

**Default future development rule:** add future award and seasonal historical data through the established canonical history approval gate first; the History UI only reads certified source records and never invents or auto-promotes them.
