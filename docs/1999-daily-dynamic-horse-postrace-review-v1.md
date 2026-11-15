# WIRE TO WIRE — Daily Dynamic Horse Postrace Review (1999 V1)

## Purpose and gameplay authority

The existing official race settlement creates one saved horse-specific postrace campaign with the placing, actual purse, recorded race trainer, recovery obligations, class goal and preferred course. Previously the single `getGamePostRaceCampaign` reader returned that original saved snapshot. This change **preserves that official historical snapshot** and adds `live_assessment` computed fresh from today's true horse care, race result and game date. It makes reviews evolve daily without inventing race results, person records, treatment or another simulation.

The same `getGamePostRaceCampaign(state,horseId)` selector, already exposed by the present `getPostRaceCampaign` career-service reader, now includes:
- Today's real game date and days elapsed from the recorded official race.
- Live current recovery phase and the trainer's welfare-based rest/light workout direction; actual horse fitness, readiness, fatigue, soreness and soundness risk.
- Days until the already saved earliest return window and whether the calendar has reached it. **A return window is not race eligibility**, a booked entry, veterinary clearance or an automatically accepted race.
- Original race-day trainer versus current trainer (if a later authorized local employment move occurred), verified official placing/field size/purse, and executed riding tactic if one was recorded. Existing AUTO races remain AUTO.
- Risk change from the documented risk at the finish and a strict modeled-result provenance label.

All former record properties (`trainer_id`, `phase`, `last_race_id`, class goals, etc.) remain identical saved facts. The new `live_assessment` is **read-only** and is never added to `runtime.post_race_campaigns.by_horse`. It recomputes after each real game day and after a valid trainer move. Callers of the existing getter receive the additional child field without changing any command or data owner.

## Historical trainer and save validity

The originally recorded `trainer_id` is the trainer responsible for the **completed race**, not a permanent pointer to the horse's current employee. Portable-save validation now checks that historical trainer against the existing **official race result and settled race entry**, preserving the exact recorded source identity even when the game's canonical employment system later assigns a different current trainer. Validation continues to require the same actual owner, settled result and real race. It does not rewrite racing history or hire anyone itself.

## Desktop compatibility assessment

**Local runtime and data:** Pure JavaScript calculations inside the existing authoritative 1999 postrace module, using the single locally stored career and official race results. It needs no web request, remote database, hosted model or Cloudflare. No alternate game engine or management UI was created. The canonical source and `public/1999/game/` browser/desktop mirror are kept in step.

**Save compatibility:** No new saved fields, format revision, finance ledger, race modification, or ID migration. Existing `.wtwsave` exports and browser IndexedDB records remain intact; older missing-postrace records still return `null`. A read-only live review never changes command revisions, cash, training or the saved campaign.

**Network dependencies:** None introduced, and the readout can operate disconnected with bundled local world/race/horse data. The existing browser career adapter uses the same getter. Cloudflare, D1, external APIs, sign-in and CDN assets are not required.

**Offline verification:** `node --test tests/1999-dynamic-postrace-horse-review.test.mjs` uses a real January 1999 settled race, next-day training, advancing recovery, historical trainer continuity, read-only save parity, existing career service and `.wtwsave` reopen. Run complete `npm test`, source/browser mirror integration, release and Windows build required checks.

**Remaining desktop migration:** Dedicated desktop workstream owns installation, bundled historical data resolution, per-user app-data saves and migration from old IndexedDB, update/backup and signed release behavior. A successful Windows build or browser test by itself is not an installed disconnected EXE/upgrade certification.

**Windows installed offline verification:** **NOT YET DESKTOP CERTIFIED**; no full offline installed Windows EXE startup/save/reboot/upgrader check is claimed by this gameplay change.

**Boundaries:** No new UI page, logo, track art, layout, contract, automatic race booking, payout, or new-race simulator. The concurrent owner race-placement PR #199 is a separate workstream; this change does not edit its selectors or service wiring.

**Rollback:** Revert changes to `src/game/post-race-campaign-1999.js` and its identical `public/1999/game/` mirror plus this documentation and focused tests. Former saves and official race results remain intact.
