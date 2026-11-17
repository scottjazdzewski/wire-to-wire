# WIRE TO WIRE — Send saved World edits for review

Players must edit the complete fictional industry through the main in-game World directories. Saved changes belong to the working career, not the immutable May 29, 1999 engineering reference.

## In the Windows game

1. Open the existing full fictional 1999 industry and enter the World directory.
2. Open a horse, person, organization or track by permanent ID. Choose EDIT THIS RECORD, then SAVE WORLD CHANGES. Supported changes commit into the existing career record.
3. Open World & Career Manager / Save–Load and choose EXPORT WORLD CHANGES FOR CHATGPT.
4. Attach the resulting WIRE_TO_WIRE_1999_WORLD_CHANGES_FOR_REVIEW_<date>.json in the WTW integration chat.
5. The integration manager reviews each entry and may promote approved source edits by immutable ID in a tested GitHub PR. Exporting never automatically changes the default pack or releases a new EXE.
6. Use EXPORT SHARED CAREER separately to preserve career gameplay and event progress; the World changes review JSON is not a complete saved career.

## Review package

The WTW_WORLD_EDIT_REVIEW_V1 JSON contains world identity, seed, source snapshot hash, active run/date, permanent IDs and changed text fields. It does not contain 300,000 full record copies, game ledger entries, photos, logos or binary media.

Reviewers must validate duplicate names, identity links, pedigree, track/date geography, historical records and ownership before promotion into the approved fictional starting-world pack. Images/portraits/logos remain a separate tracked requirement under issue #189.

The bundled May 29 reference cannot be overwritten. Save/reopen, upgrade, cross-screen engine effects, original save compatibility and actual offline Windows portable/installer tests are mandatory gates. Until these pass, the editor remains a partial development playtest, not a certified commercial editable-world release.
