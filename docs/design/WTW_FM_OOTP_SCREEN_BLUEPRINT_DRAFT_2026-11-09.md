# WIRE TO WIRE — FM/OOTP-Inspired Desktop Screen Blueprint
**Status:** Design direction proposed for user approval. NOT a new source-of-truth database, NOT a live UI replacement.
**Date:** 2026-11-09
**Starting point:** Published FM v30 Office plus compact/Stable/badge overlay (GitHub main). Preserve approved canonical data, 1999-world intent, routes, historical archive, and working decisions/save behavior.

## 0. The visual goal
Make WTW look like a polished horse-racing management game rather than a busy analytics dashboard. Borrow Football Manager/OOTP's hierarchy, navigation, information grouping, tabular rows and focus states—not copyrighted artwork, team badges, brand colors, or fictional player data.

**Nonnegotiable branding:** square approved green/black/red WTW logo with white racehorse and jockey, “Wire to Wire” wordmark, 12 original approved dark-forest-green/gold transparent badge PNGs. Retain WTW's dark forest green, black, white/ivory, restrained red and muted gold. DO NOT replace the WTW logo with the generated mockup's running-horse icon. DO NOT adopt that mockup's navy/magenta palette or its fictional Riverside/Ascot/2026 results.

### Palette — based on existing approved WTW UI tokens
- Base/background: `#050907` and `#07130f` (charcoal-black).
- Header/shell: `#09140f`, `#0b2419` (deep forest green).
- Panel: `#111c17`, `#13241d`, with darker alternate rows `#0b1512`.
- Borders: `#283c33`, light separators `#38564a`.
- Body/high-emphasis: `#eaf5ee`, `#f7fff9`; secondary `#aabdb3` (no low contrast microtext).
- Positive/action green: `#0aa36b` or `#0b7654`.
- Urgent/Continue red: `#d9474f`, darker `#9f2d35` (not neon magenta).
- Identity/gold accent: `#e8c65e`; never use gold on every cell.
- Approved v2 category shield artwork remains untouched: horse, people, farm/stable, track, pedigree, career record, achievements, reputation, meet schedule, major races, connections, history.

### Desktop proportions — 1366×768, 100% zoom
- Two-part top navigation: primary 48px, secondary 30px (78px combined); WTW logo and wordmark always readable.
- Main viewport: outer padding 12px, column gap 12px, card gap 10–12px.
- Office columns: **340px inbox / flexible 690px center / 288px utilities** at 1366px viewport (allow rounding and responsive adjustments). At 1280px: 312px inbox / flexible center / 264px utilities.
- Major panel padding 12–16px, 8px internal row gap, action-row height 48–58px; table/data-row 38–44px.
- Page title 21–24px; section heading 14–15px; normal text 13–14px/1.35 line-height; secondary 12px. Avoid 8–10px text as the means of making elements fit.
- Data tables use consistent tabular numerals and column alignment. Contents scroll **inside** their panels on desktop; not by compressing fonts.
- Stronger center-panel hierarchy: one focal task/module per screen; fewer simultaneously competing notices. Put detailed evidence behind tabs, drill-downs, or expanders.
- Major panels should have restrained borders and subtle tonal contrasts, NOT repeated heavy gradients, decorative background bands, oversized hero photographs or numerous nested boxes.
- Interactive controls 32–36px desktop; 44px mobile later.

## 1. Portal / Overview (build first)
**Navigation:** keep canonical top items Office, Stable, Race Calendar, Sales, World, News, plus existing Back/Forward, +Day/+Week/+Month/+Year, Save/Load/Continue/Export/Reset. The visual grouping may become FM-style primary/secondary navigation without duplicating actions.

**Left (340px):** Messages as a real inbox. Header with All / Unread / Tasks filters. Show approximately six to eight legible 52px rows; sender, short subject, timestamp, optional one meaningful category. More messages scroll within inbox. Selected message clearly highlighted.

**Center (flexible):** a compact 86–104px operation/game-date identity strip, NOT a giant hero. Main focal area is **Decision Desk** with selected message, meaningful Intel Stack, and exactly the existing available strategic choices; labels must not imply a recommended option. Below, display two linked actionable compact modules: next relevant Race/Entry and Horse/Stable context. Show only data supported by canonical game state, not the fictional horse and race facts in the design concept. If no upcoming race is known, show an honest "No entry scheduled" state with Open Calendar/Stable link.

**Right (288px):** three stacked panels, in order: Race Schedule, Stable Board/Signals, Opportunity Board. These retain current navigation and actual state. Surface more details only after selecting a row; no new World Pulse. A budget/training/reputation widget may only be shown when its real data is integrated.

**Layout acceptance:** readable 13–14px body copy at 1366×768, clear visible action, no clipped hero/choice buttons, no global scroll, all inbox/side-panel lists independently scroll.

## 2. Stable
Replace huge sparse stable cards with an efficient management roster. Header: stable/operation identity, existing date and 3–4 supported status counters. Below: a full-width 40–44px-row roster with horse name, age/sex if known, trainer/barn, status, planned/next race if known, latest relevant decision. Allow modest filters/sort and a right-side contextual detail panel when a horse is selected. A horse name opens **the same canonical Horse Profile** (stable-ID route); decision links lead to existing Decision Desk. Do not duplicate/create another roster store or silently invent race readiness.

## 3. Horse Profile
Refine the existing functional Horse Profile template. Top 90–110px identity header with approved horse shield displayed 56–72px, horse name, known identity/location/status; breadcrumb, one authorized Edit Profile action (audited, no decorative nonworking button). Underneath: 3–5 supported quick facts and tabs: Overview, Career Record, Pedigree, Achievements, Connections, History. Use approved per-section badges at 24–32px. Two-column content region on laptop; tables 40px rows; historical prose collapsible. Owner, trainer, jockey, farm, next race and parents open their own canonical ID route when available. Unknown facts explicitly marked not available, never fabricated.

## 4. Race Calendar
Provide an FM-style calendar/list combination. Header with current in-world month/track scope, existing real time-step controls, compact view toggles. Calendar/list displays confirmed/known race entries and stakes **only** when supported by the approved event/edition/date source. Selecting a race opens a dedicated Race Profile with conditions, track, entrants/scratches/status/results when supported. Use clear color-coded commitment chips for entered, considered, and result without misrepresenting tentative decisions as confirmed starters. Allow track and race-type filters; no impossible travel assumptions; no duplicate new scheduling ledger.

## 5. Track Profile
Refine existing track profile, do not build a second template. Identity header with approved Track shield 56–72px; city, state/province, country, surfaces/geometry when sourced. Tabs: Overview, Meet Schedule, Major Races, Travel/Location, History. Show a compact meet schedule with explicit evidence state; major race list links to dedicated Race Profiles. Long historical records below the fold. No fake race dates or unsourced travel distances.

## 6. Shared asset/profile and app behavior
Use ONE profile-header design, ONE badge component, ONE stat-strip style, ONE table/row family, ONE nav/breadcrumb model, and one canonical game state. Person/Farm/Race/Meet use analogous compact templates, not new parallel databases. IDs, not names, should be persistent route keys when canonical IDs are available. Every visible button and clickable name must work; Back restores selection/scroll context. Save and Load must preserve exact existing state. The editing workflow must honor the canonical audited overlay; do not write into locked source history.

## 7. Build order / gates
1. **Visual candidate A:** complete redesigned Portal/Overview at 1366×768; compare screenshot with user-supplied FM screenshots and WTW scheme. Get approval before sitewide visual promotion. This is an actual structural redesign, not a handful of appended CSS overrides.
2. **Visual candidate B:** Stable and Horse Profile with same tokens/components.
3. **Visual candidate C:** Race Calendar and Track Profile.
4. **Regression gate:** all original navigation, profile links, badges, decision effects, Save/Load, historical archive and canonical data preserved; test 1280×800, 1366×768, 1440×900, 125% browser zoom.
5. **Responsive follow-on:** after desktop direction is approved, mobile/tablet adapt the same application; do not shrink or horizontally pan three fixed desktop columns. Phone touch targets 44px; no truncated information and natural mobile scrolling.

**Source authority:** the current live approved Drive build/authority ledger, current approved badge manifest, and current deployed GitHub repository as separately reconciled; this blueprint is proposed visual direction only. No data/engine authority is transferred to this document.
