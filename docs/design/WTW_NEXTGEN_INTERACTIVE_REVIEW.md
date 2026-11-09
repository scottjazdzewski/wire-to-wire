# WTW NEXT — interactive redesign review
Status: **WORKING EXPERIMENTAL UI / NOT YET PROMOTED TO CANONICAL SITE ROOT**.

URL when deployed: https://wire-to-wire.pages.dev/next/

This is not a mockup. It is one HTML page, one new CSS design system, and one new JS UI adapter using the pre-existing Office v30 game core and v37 state-aware enhancements. Every horse, race, decision, and save uses the original state; the new UI does not create a second game ledger or scenario corpus.

Try: select a different inbox item; return to Powerline; choose a decision; see status and entry update; click a horse to open a fully redesigned profile; switch the profile's Career Record/Pedigree/Connections tabs; open the Race Calendar; click horses and racetracks. Other primary management areas have navigable placeholders without invented data.

Source imagery is the approved WTW logo, twelve approved v2 section badges, and the existing generic racing-stable photograph (not claimed to depict a particular horse).

The Office at 1150×720, 1280×800, 1366×768 and 1440×900 has been rendered with no document overflow. Local browser QA for genuine Save/Load used a storage shim due to opaque-origin test isolation; Cloudflare-origin persistence and deep-link refresh require live review. Mobile layout is experimental.

No change to live root or historical archive. Only move root to this architecture after visual, interaction, and persistence acceptance.


## Follow-on refinement (2026-11-09)
- Shared Horse/Track/Person/Farm profile component now has one integrated identity banner rather than two duplicate title cards; keeps approved type-specific v2 badge and profile tabs.
- Race Calendar now derives a clickable 14-day operations grid from the same Office source fixtures and commitments; event colors distinguish targets, confirmed entries and non-race obligations. No new race records or extra stores.
- Updated same /next/next.css (still one stylesheet) for tighter high-resolution panel/identity surfaces and accessible text at 1150–1366px. No new visual layer.
- Local Chromium checks: 1366×768, 1280×800 and 1150×720; no document overflow or JS errors; 14 calendar cells, six source events, click calendar race target opens correct Horse page, change decision then calendar updates 1 entered, and profile Career Record tab works.
- Cloudflare-origin reload, persistent Save/Load and mobile still require review.
