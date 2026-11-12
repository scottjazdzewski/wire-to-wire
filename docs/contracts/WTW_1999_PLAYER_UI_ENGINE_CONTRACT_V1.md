# WIRE TO WIRE — 1999 Website ↔ Gameplay Engine Interface Contract V1

Status: UI-SIDE PROPOSAL FOR ENGINE OWNER REVIEW. It is NOT an accepted engine release or a live production connection.
Date: November 12, 2026
Website owner: 1999 Website & Player Interface Window, repository scottjazdzewski/wire-to-wire.
Gameplay owner: Gameplay / Playability Window, versioned engine releases and canonical journals in Google Drive.

## Why there must be a strict boundary

The website's approved /next/ Office/FM experience currently displays an 87,500-horse modeled 1999 universe anchored to 267 historically established opening horses. The latest verified Drive gameplay engine handoff, v1.34, is a DIFFERENT 5,000-horse, 10-track fictional sandbox. The 10-day engine replay and financial audits do not establish a playable production UI or reconcile identities.

Never merge these worlds by matching horse names, converting test IDs into historical IDs, or silently treating fictional race outcomes as historical. The browser's existing wtw1999ManagementStateV1 local save and its test-only horse conditioning must not be presented as the game engine's authoritative transaction journal.

The canonical gameplay owner alone operates canonical-transaction.mjs, canonical-event-store.mjs, AI and player parity, physical condition rules, entry eligibility, race results, payouts, saved checkpoints, replay, finances, and economics.

The website owns presentation, navigation, typography, the accepted Office/FM layout, approved images/badges, visible-world search, entity profiles, accessible controls, and browser QA.

## 1. Engine to website — VERSIONED READ MODEL

Proposed schema name: WTW_1999_PLAYER_PROJECTION_V1

The engine must supply an already authorized PLAYER_SAFE projection, containing:

- engine: release version and full SHA-256 digest for the accepted Drive release.
- world: explicitly FICTIONAL_ENGINE_SANDBOX or HISTORY_INTEGRATED; snapshotId; and canonicalSourceSnapshotId when claiming the integrated historical opening.
- session: exact session ID, 1999-or-later ISO date, monotonically increasing revision and replay-verified journalHash.
- player: exact person ID, optional organization ID, role, and visibility=PLAYER_SAFE.
- horses: player's visible horses by original ID, display name, owner/trainer/track IDs, age/sex/status, and strictly player-visible observed or modeled condition; no covert genetic potential, hidden competitor scouting, or invented medical clearance.
- races: exact race ID, track ID, racing date, published conditions, engine-declared status and nomination deadline. A condition-book offer is NOT a confirmed final card.
- entries: separate real entry IDs, horse IDs, race IDs and declared status.
- results: committed results only, never a website prediction represented as a completed race.
- finances: USD integer minor units for posted account balance and posted transactions, with transaction IDs; no predicted purses silently added to cash.
- permissions: engine-evaluated action and target plus allowed boolean and refusal reasonCode. Buttons must not infer permission from a horse's owner label or stable roster membership.

All IDs remain opaque and unchanged. Source-backed historical IDs are never fabricated to resolve an integration gap.

The website-side candidate validator and view adapter are in:
public/next/1999-canonical-gameplay-bridge.mjs

It provides:
- playerVisibleProjection(raw, authorityPinnings): reject mismatched source world, malformed/duplicate IDs, unlinked entries/results, absent engine release/hash, missing player-safe visibility, and non-integer finance values. Return only approved display fields in immutable objects.
- createPlayerGameplayBridge({getProjection,submitCommand,expectedWorldSnapshotId,expectedEngineSha256}): require engine-supplied read and command transport, re-read after accepted action, and keep an ephemeral projection only.

This module is deliberately NOT included in the live site yet. Neither engine transport endpoints nor authentic ID reconciliation have been released to the website owner.

## 2. Website to engine — VALIDATED COMMAND ONLY

Proposed schema name: WTW_1999_PLAYER_COMMAND_V1

Required command envelope:
- schema, commandId (stable for retries and idempotency).
- sessionId, expectedRevision, expectedJournalHash.
- worldSnapshotId, engineSha256 (must match the viewed game).
- action: an ENGINE-DEFINED name, never an invented website rule.
- targetId: exact previously issued entity ID, or null for session-wide commands.
- payload: explicit user choice, not a fabricated outcome.

The website only submits when the engine has projected an allowed permission for the action/target. The game engine must revalidate player identity, authority, actual eligibility, owner consent, jockey availability, track rules, physical health, scheduling, and sufficient funds.

Proposed receipt schema: WTW_1999_PLAYER_RECEIPT_V1, matching commandId and sessionId. Status is APPLIED, ALREADY_APPLIED, or REJECTED, with an engine reasonCode. After an accepted receipt, the website must refresh the engine projection before showing updated results. The UI may display a refused command as a refusal; it cannot override it.

No assumed HTTP routes, credentials, signing protocols or localStorage authorizations. getProjection and submitCommand are injection points; the actual transport belongs to the gameplay owner.

## 3. Approved UI screen ownership

| Existing Office/FM surface | Engine's facts | Website's responsibility |
|---|---|---|
| Global date and Continue | In-world date, permission to advance, journal-revision receipt | Display, click, loading/error, re-read |
| Stable / Horses / Training | Visible horse IDs, fitness/recovery, permitted work choices | Roster filters, visual condition, form controls |
| Racing / Planning / Entries | Published card and condition book, nomination/entry status, scratches | Date browsing, entry request, status distinctions |
| Personnel | Trainer/jockey identities, relationships, agreements | Navigation, profiles and discovery |
| Finances | Posted amounts and real journal transaction IDs | Currency formatting, ledger filters |
| Office / Messages / Decisions | Engine notifications, due actions and allowable replies | Inbox and action deep links |
| World / Tracks / History | Established IDs, geography, historical facts, media | Read-only profile routing and imagery |
| Save / Load | Engine run identity and durable checkpoint state | Trigger approved load/save transport and restore UI context |

This does not authorize redesign, new menu hierarchy, different badges, or replacement of existing Office/FM screens.

## 4. Activation gates and cross-window acceptance

1. Gameplay owner issues an exact Drive release ID, version, SHA-256, committed read schema, player permissions, sample player-safe projection, and two command receipts (one accepted, one refused).
2. Gameplay owner provides tested identity mapping: the 267 historical H-IDs and their owner/trainer/track associations if declaring HISTORY_INTEGRATED. A sandbox-only release remains labeled sandbox.
3. Gameplay owner supplies an authoritative getProjection / submitCommand transport. It is never reverse-engineered from fictional local state or inferred from a release ZIP.
4. Gameplay window signs off on transaction, replay, finance and save/resume correctness. Website only tests that displays follow its outputs and preserve exact IDs.
5. Browser flow passes: start Jan 1; open stable and conditions; choose one engine-authorized action; Continue; display recorded consequence; save/reopen; confirm exact journal revision/hash; verify refusal and network failures.
6. Only then replace old client-side prototype action handlers with canonical engine receipts. Preserve the approved visual design, sandbox warnings and rollback.
7. Independently verify responsive navigation, search, scroll, asset loads, no hidden private competitor data, and no stale/duplicate submission.

## 5. Evidence and recovery

- Engine Drive folder 06_GAME_ENGINE: ID 1aI6W7PeEM4A571cw8J0H8ELOjQUBUM7q.
- Verified 1.34 engine handoff: WTW_GAME_ENGINE_READ_ME_FIRST_V1_34.md (Drive ID 1mEsk8jxbJjrC5jzb7XIqZwgKcxWAqXui).
- Playability owner: WTW_PLAYABILITY_WINDOW_HANDOFF_V134.md (Drive ID 1pdtPFBRWypBGrkBcGxBj8AkqFedPUGb2). It explicitly requires a read model and command interface, without modifying the Office UI.
- World identity boundary: WTW_1999_PREPLAY_INTEGRATION_TEST_REPORT_2026-11-12.md (Drive ID 1FIUmvijjfdc73S8om5dYxndLXvLEyyda). It reports 267 historical H-IDs and refuses to conflate them with the 5,000-horse fictional engine.
- Current website integration points: public/next/index.html, public/next/next.js, public/next/1999-ui-source.mjs, public/next/1999-bootstrap.js.
- The older standalone Office FM v24 Drive artifact is not authorization to replace the newer /next/ GitHub production interface.

CURRENT COMPLETION: Website-only proposed interface contract and isolated validator. There is NO live canonical engine link, NO independently created gameplay state, and NO gameplay rules changed.
