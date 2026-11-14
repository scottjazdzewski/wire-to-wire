# Wire to Wire — Trainer Management Requests (1999 game V1)

This is a **playable-game engine extension** to merged dynamic owner–trainer reviews (PR #166). It does not redesign the approved management interface, introduce a second simulator, invent veterinary diagnoses, rewrite historical personnel, pay phantom cash or automatically fire a trainer.

## Real-event triggers

Only events that the authoritative career command generated, dated and journaled can open a trainer request. Source event references remain in each saved request.

| Trigger | Request | Evidence |
|---|---|---|
| Actual `HORSE_CARE_UNFUNDED` in a staffed, operating barn | `CARE_FUNDING` | Horse, owning organization, real shortfall and existing daily care record |
| Actual `POST_RACE_PROFESSIONAL_FEEDBACK` below the horse's ability-based expectation | `POST_RACE_RECOVERY` | Official settled race, actual runner, finish and current training condition |
| Actual `POST_RACE_PROFESSIONAL_FEEDBACK` above expectation, at least three starts, and actual market quote above signed terms | `CONTRACT_TERMS` | Saved race and trainer record, current quote and signed contract |

There is at most one pending management request per owner–trainer partnership. A 14-day request cooldown prevents constant repeat prompts. Requests have a seven-day in-game response window. Expiration decreases trainer support slightly, but never changes horse employment, race outcome or contract.

## Owner command

Command: `ANSWER_TRAINER_MANAGEMENT_REQUEST` (actor `player`).

```json
{
  "owner_id": "O-REAL-APPROVED-ID",
  "trainer_id": "P-REAL-APPROVED-ID",
  "request_id": "EXACT-PENDING-REQUEST-ID",
  "choice": "ACCEPT"
}
```

Authorized choices: `ACCEPT`, `COUNTER`, `DECLINE`. Only the player who owns that actual racing operation can submit this command; identity, live owner/trainer association, exact open request ID, response deadline and command replay ID are enforced by the canonical dispatcher. Command errors never mutate the game save.

### What choices do

- **Care funding:** ACCEPT authorizes ten days of modeled care budget at an affordable seven-day cash threshold and PROACTIVE supervision; COUNTER authorizes three days at the current care program, requiring three days of actual cash capacity; DECLINE makes no care-policy change. Raising an authorization is **not a cash posting**. Actual paid care, boarding and trainer revenue are charged by the already-existing daily care ledger when delivered. An owner with insufficient cash cannot buy care by merely agreeing.
- **Postrace recovery:** ACCEPT imposes an actual temporary REST horse training policy for six days; COUNTER chooses LIGHT for five days. The policy goes through the existing care command. Mandatory postrace welfare/rest protections always outrank discretionary workout pressure. At expiry, the old training direction is restored only if no later owner/trainer command superseded it. The recorded training order and its restoration/supersession survive save/reload.
- **Trainer contract:** ACCEPT offers the actual currently quoted minimum plus a small premium; COUNTER offers the exact current trainer minimum. Both use the existing trainer acceptance, affordability, pending-effective-date and signed daily-fee logic. Insufficient owner cash or conflicting pending terms reject the action; no backdated wage or invented transfer is allowed.
- **DECLINE:** leaves existing care and terms unchanged and records a small negative trainer-support consequence. ACCEPT/COUNTER record bounded positive support signals only when their genuine operational action succeeds.

AI owners use the same saved request workflow and actual capacity and cash; they respond deterministically with ACCEPT, COUNTER or DECLINE. Player requests remain pending until the owner answers or the deadline passes.

## Integration / UI handoff

`getTrainerManagementRequests(state, ownerId)` is a read-only projection of that owner's pending requests, last 24 completed/expired requests, temporary workouts and counters. The approved UI window should surface those exact engine-owned rows in the existing Decision Desk, dispatch `ANSWER_TRAINER_MANAGEMENT_REQUEST` once with a unique command ID, and refresh from the game save. **No UI has been created by this gameplay workstream**; don't infer that button integration is already live.

The canonical browser mirror is tracked by `scripts/sync-1999-browser-gameplay.mjs --check`. All information is modeled game gameplay, not historically sourced contracts or real human personalities.

## Verification

- `node --test tests/1999-trainer-management-requests.test.mjs`
- `npm test`
- `node scripts/sync-1999-browser-gameplay.mjs --check`
- Existing browser 1999 career, source, save/reopen, IndexedDB and product integrity workflows

Current scope intentionally **does not** implement trainer hiring, termination, ownership transfers, injury diagnoses, or horse-race outcome overrides. Those require separate permission and welfare/eligibility modeling.
