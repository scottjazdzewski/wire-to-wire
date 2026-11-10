# Wire to Wire Next v4 — Office completion pass
November 9, 2026 | Review path /next/; existing homepage unchanged.

## Changes
- Source-derived **8-case Office queue**: case pips, previous/next, focus states, and next unresolved case control after recording a choice.
- All queue navigation uses the original canonical message selection; no new gameplay data store.
- Honest inbox labels: All, Open, Urgent, Reviewed. Earlier New/Unread both meant unresolved, without true read-receipt data.
- Working quick actions: Open Cases focuses an outstanding case, Your Horses opens Stable, Entered/Targeted opens Race Calendar, in-world date opens Calendar, WTW logo opens Office. Case title opens its decision file.
- More legible desktop inbox, Intel, action, roster and race text; compact size fallback on short-height displays. The original v2 shields, flags and generic stable reference photograph remain.
- Critical UI correction: resolved choices previously remained confined to one-third of the panel, causing outcome content to be clipped. Now Effect, Barn Reaction, Follow-up and Next Open Case use the full results pane.

## Browser QA (local Chromium)
- Tested 1440x900, 1366x768, 1280x800, 1150x720, 1093x614: zero document overflow, all six horses, three race targets and applicable choices remain visible.
- Tested case previous/next and direct case-eight selection. Confirmed two urgent source items and correct Open/Reviewed counts.
- Original engine decision Enter Saturday updates saved Powerline decision, Stable and Race Schedule, and the 14-day calendar shows one confirmed entry. Next Open Case selects The Last Match. Horse Profile opens Iron Harbor.
- All eight original cases, each with all three result tabs, verified at 1366x768, 1150x720 and 1093x614: no clipped text or browser errors (24 states per screen size).
- Local opaque origin uses a storage shim and history stub. Hosted Save/Load persistence, Cloudflare deployment and real browser Back/Forward still need on-site verification.

## Authority, limits
No change to canonical Office decision engine, saved-state schema, 2014 prototype source data, published root website, archive or approved v2 artwork. The Next UI continues to use one active external stylesheet. Nonconnected primary sections remain honest placeholders; this release does not represent a complete 1999-world simulation or final Football Manager-quality approval.
