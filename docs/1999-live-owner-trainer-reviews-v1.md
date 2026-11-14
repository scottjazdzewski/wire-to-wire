# Live owner–trainer relationship reviews — January 1999 game

Gameplay-only incremental release. **The 28-day career review is now a formal checkpoint, not a freeze on how relationships develop between reviews.**

## Authoritative live sequence

The one `ADVANCE_DAY` command first performs shipping arrivals, scheduled salary/review decisions, owner/trainer/barn operations, actual paid care, training and post-day relationship feedback, and autonomous race settlement. **After those effects have posted**, `updateOwnerTrainerLiveReviews` reads the same owner/trainer pairs and actual saved accounts, results and relationships. Every active pair receives a bounded 14-day live trend with today’s owner confidence, owner outlook, trainer position, real trust/support, and the last actual race.

A current view never substitutes a 28-day cached opinion: `getOwnerTrainerCareerReview` now calculates its `live_assessment` from actual current save evidence *on demand*. Its top-level `trainer_position` and reason match this live reading. `last_formal_trainer_position`, `last_evaluation`, review count, existing player mandates and recurring 28-day checkpoints remain intact. The pure `ownerTrainerLiveAssessment` selector does not advance time, create money, mutate the state, or infer real historical personality information.

## Meaningful triggers

- Every completed game day: training, financed care, unpaid obligations, and relationship recovery or deterioration
- Every official simulated race: last race identifier, placing, career form and live trust/owner outlook update the same day
- Authorized owner/player actions: care policies, rider/entry confirmations, service terms and concern responses
- A newly escalated trainer position can generate an actionable concern before the scheduled 28-day review. Only a genuine transition to `PRESSING_FOR_CHANGE` or `CONSIDERING_DEPARTURE` opens it, with the existing 14-day reply period and owner authorization. AI owners reply through the existing bounded response path. Requests are not re-opened every day, and formal reviews respect the same recent-request cooldown.

## No hidden turnover or invented results

A live confidence or trainer-position change is **not** an automatic firing, resignation, trainer transfer, new contract, made-up purse or assumed race result. Form-based formal mandates remain sample-aware, while a single result is permitted to move a confidence score modestly. Current signed terms and existing owner-only authority are unchanged.

## Compatibility and read contract

Older saves with no `live_assessment` or `live_history` remain importable. New saves validate live owner/trainer IDs, game dates, sentiment values and bounded history. The game journal only emits `OWNER_TRAINER_LIVE_STATUS` on a material qualitative change or an actual race result; routine numeric drift stays in the bounded 14-day trend. Same-date responses replace the day's trend row rather than generating duplicates. Browser `public/1999/game` modules match the canonical `src/game` engine using the existing source mirror check.

The separate UI engineering window can display `getOwnerTrainerCareerReview(...).live_assessment` and `live_history` in the existing management layout. Do not create a second UI relationship model or claim the Decision Desk exposes these controls before its UI owner binds them.

## Verification

`node --test tests/1999-dynamic-owner-trainer-live-reviews.test.mjs`, `npm test`, all existing 1999 source and read-only regression checks, Chromium career/save/restart checks, and `node scripts/sync-1999-browser-gameplay.mjs --check`.
