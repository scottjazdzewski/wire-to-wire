# 1999 trainer concern conversations — gameplay V1

Scope: **existing saved 1999 career engine**, not a new Office interface, biography, or historical personnel source. Builds directly on the actual 28-day owner–trainer performance reviews and actual daily/race relationship feedback.

## Trigger

On a due 28-day review, an existing real owner–trainer pair generates a concern only when its independently assessed trainer position is `PRESSING_FOR_CHANGE` or `CONSIDERING_DEPARTURE`. A pair has **at most one open concern**. Each request is keyed by the immutable owner ID, trainer ID, and opening career date. Requests are due within 14 in-game days. On the next day after the deadline, unanswered concerns close as `EXPIRED`, reducing trainer support by .030. Expiration does not dismiss or reassign the trainer.

For AI-owned pairs, the AI owner answers immediately from the existing evidence: current cash, observed paid/unfunded care, owner patience, and relationship strength. The AI does not make a fictitious payment or a binding contract offer.

For the human-owned operation, the concern remains `OPEN` until answered or expired.

## Owner response command

`RESPOND_TO_TRAINER_CONCERN`, `actor: "player"`

```json
{
  "owner_id": "O-EXISTING-ID",
  "trainer_id": "P-EXISTING-ID",
  "request_id": "O-EXISTING-ID|P-EXISTING-ID|1999-01-30",
  "response": "HEAR_AND_REVIEW"
}
```

Available responses:

- `HEAR_AND_REVIEW` — earns a small +.028 trainer-support signal **only** when observed care has no outstanding unfunded days and the owner has a positive actual cash balance. A conversation cannot replace payments. Otherwise the request is acknowledged with no artificial improvement.
- `HOLD_CURRENT_COURSE` — reduces trainer support by .025; this is not dismissal or removal.

Relationship feedback feeds the **same** `workingRelationshipProfile`, trainer daily workout decisions, 28-day reviews and `trainerContractQuote`. Existing wage terms, signed contracts, training orders and cash accounts do **not** change automatically.

Commands require an actual registered owner/trainer pair, an exact open request ID, the player owner role, and matching player organization ID. The game kernel's existing unique-command receipt gate protects replay and conflicting retries. Rejected commands do not mutate the save.

## Read-only projection and journal

`getOwnerTrainerCareerReview(state, world, ownerId, trainerId)` adds:

- `pending_concern` — an actionable concern or `null`
- `latest_concern` — latest request, including closed status and reason, or `null`
- `concern_history` — up to eight dated, resolved/expired responses with before/after trainer-support values

The existing `event_log` records `TRAINER_CONCERN_OPENED`, `TRAINER_CONCERN_RESPONDED`, and `TRAINER_CONCERN_EXPIRED`. Counter totals identify player responses, AI responses, and missed concerns. Legacy career saves with no concern fields remain valid.

## Boundaries

No automatic firings, resignations, horse transfers, contract renewal, financial postings, additional personnel, UI restructuring, race-engine changes, or alterations to source historical identities. Future player-facing UI should consume the engine's read-only concern and command bridge, not implement conversation logic in the view layer.

## Verification

Run `node --test tests/1999-trainer-concern-conversations.test.mjs` and `npm test`. Tests cover permissions, independent AI replies, impact on contract quotes, expiry, no money/employment side effects, idempotent replay and full save export/import.
