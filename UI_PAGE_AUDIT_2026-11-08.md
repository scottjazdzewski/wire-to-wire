# WIRE TO WIRE — Page-by-Page UI Audit
**Updated:** 2026-11-09  
**Scope:** Every route and shared surface in the current archive app. Visual direction: premium Thoroughbred operations desk with deep forest, ivory, restrained brass and the existing red brand accent. Fictional artwork remains placeholder-only.

| Page or surface | Audit finding | Update |
|---|---|---|
| Command Center | Role controls could read as an active simulation. | Role and involvement remain device preferences only; simulation pause is explicit. The supplied v0.18 screen is retained as a future gameplay reference, not imported as an active loop. |
| Race Calendar | A stacked list hid the shape of the season; “+ more” on busy dates was not actionable. | Uses a Sunday-first month grid with month navigation and a monthly race card. “+ more” now scrolls directly to the complete dated race card; exact, internal, unverified, fixed, held, missing-day and not-run status remain distinct. |
| My Stable | Cards need clear identity, source class and compact performance facts. | Keeps image placeholders; emphasizes names and imported top-three facts; profiles show sire, dam, recorded placings and achievements with missing starts and earnings labeled unavailable. |
| People & Farms | People and organizations were combined into one undifferentiated grid. | Split into counted People and Farms & Organizations sections; keeps portrait/logo slots as placeholders. |
| Racecourses | The registry is inherently tabular, but can feel like a raw database. | Uses a high-contrast table header, row striping, hover state and a clearer record-status hierarchy. |
| History Vault | Race records need fast scanning by time, with confidence visible. | Keeps chronological year/month grouping, date-evidence badges and compact fixture rows. |
| Record Review | Proposal governance visually blends into ordinary rows. | Strengthens status, evidence and action hierarchy while preserving proposal-only behavior and source protection. |
| History Coverage | Reconciliation detail was dense, and the first delta audit’s QA summary became stale. | Shows current master dashboard QA totals and surfaces the conflicting “QA Closed — Canon” vs “QA Verified — Promotion Pending” labels. It explicitly marks the prior date/result queues as snapshots to revalidate before action. |
| Search | Race matches were not chronological and result cards had weak hierarchy. | Sorts race matches by year/date/name and keeps permanent identities visible in polished result cards. |
| Profiles, dialogs and shared navigation | A horse-detail fetch could finish after another profile opened; selected navigation had no programmatic current-page state. | Horse pedigree/season details now apply only to the matching open horse. Active navigation exposes aria-current=page; drawers and dialogs retain source-safe edit controls. |

The month grid includes full recorded dates whose evidence kind is suitable for a schedule view. Held or unresolved dates, partial or missing days, and non-runs remain visible separately. “View all” takes the visitor to the complete monthly race card.

The v3.67 control dashboard currently reports 2 verified-date blockers, 118 calendar/field holds, 20 high reviews, 393 mixed-date reviews, 1 era/context pass and 8 active races without a recorded day. The current workbook also conflicts on promotion status: its Control_Dashboard title says “QA Closed — Canon,” while the Master_Stakes_Calendar header says “QA Verified — Promotion Pending.”

This is a source-code audit plus review of the supplied screenshot and connected source workbook. Live browser comparison remains blocked by Cloudflare Access's email-code screen; no visual claim is made about the current published rendering.