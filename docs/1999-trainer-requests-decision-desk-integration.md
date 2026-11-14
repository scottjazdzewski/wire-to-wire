# Trainer management requests → existing Decision Desk (1999 gameplay)

This is the browser/management integration following the merged gameplay PR #171. It is **not** a second UI, an Office overlay, a new save format, or a background simulator.

## Where it works

The unified `/next/` management interface already contains the Decision Desk and Inbox. In the explicitly selected, playable **38-horse January 1999** career (`?playtest=38`), the current single IndexedDB-backed game service exposes `getTrainerManagementRequests()`, scoped to the **player-owned** operation. Opening a request creates one Inbox file under the existing Desk and three existing-style management actions.

The default founding `1999` view is intentionally a source-only population opening, not the separate 38-horse gameplay run. In that mode, no trainer request should be invented, and attempting to dispatch a trainer-management action fails closed. When full production career gameplay is wired to the founding world, it should reuse the same game service and Desk projection, rather than hardcode demonstrations or resurrect old Office UI.

## One authority, one command

The headless `office-direct-read.js` adapter reads the canonical **immutable projection** from `getTrainerManagementRequests()`, plus the player's actual horse names and IDs. It maps pending requests and recent saved decisions into the same Desk/Inbox structure already used by engine decisions. It does not write decisions, mutate game state, cache personal finance changes or read invented data.

In the Desk:

- Unfunded care: Approve enhanced funded care / Authorize a limited care budget / Decline funding request
- Postrace recovery: Accept temporary rest / Compromise on light training / Decline the plan
- Contract terms: Offer trainer premium / Offer market-rate terms / Keep current terms

Each action calls `__WTW_OFFICE_COMMANDS__.dispatch('ANSWER_TRAINER_MANAGEMENT_REQUEST',{request_id,choice})`. The headless command adapter verifies the live player owner, exact open request, available choice and deadline, then passes the canonical engine command with verified owner/trainer IDs through the existing `playtest.submit` IndexedDB transaction.

**Success** produces the engine's real saved request receipt; the Desk becomes a reviewed case, shows the recorded choice/date, and can show new facts on the next paint. **Failure** retains the open case, shows the error and releases its one-at-a-time submission lock; no optimistic cash or care transaction is shown. Reopening the same saved career reconstructs the same request and receipt directly from the game run.

No new route, CSS skin, parallel journal, or independent game decision writer is introduced. The existing UI's escape/sanitization and button disabling rules remain in place.

## Guardrails

1. Only the current player owner sees and can answer their own requests.
2. Requests originate from the authoritative race/care event journal, not web page strings.
3. No duplicate or stale request can be processed twice; the engine's receipt gate and identity checks remain authoritative.
4. No money changes are faked by the UI; the real gameplay ledger owns funding and contracts.
5. No UI-mandated firing, transfer or invented racing result.
6. No alternate Office presentation, default-world pilot data, or new save storage.

## Verification

`node --test tests/1999-trainer-management-decision-desk.test.mjs tests/office-direct-read-adapter.test.mjs tests/office-direct-command-bridge.test.mjs` and `npm test`. Existing Chromium, UI source, 1999 calendar/source, browser persistence and product integrity checks remain mandatory.
