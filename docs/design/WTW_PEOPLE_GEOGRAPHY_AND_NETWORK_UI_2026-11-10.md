# WTW People Profile — Geographic Identity & Relationship Network UI
**UI delivery:** November 10, 2026  
**Scope:** UI/read-only views only. Gameplay generation, reputation, relationship formation, nationality assignment and character aging are owned by the playability window.

## Tier 1: Identity beside the name
- Role from the active Office source.
- **Birth country and real SVG flag** from the approved canonical birthplace. This is labeled **BIRTH COUNTRY**, not nationality, when citizenship is not recorded.
- **Nationality** replaces birth country only when supported by a source-linked game identity record. A nationality flag must have its own approved country code; it must not borrow a mismatching birthplace flag.
- **Age** from a sourced date of birth and the *in-game* date (normal human birthdays), or from a sourced Office age. Otherwise show an honest dash.
- **Hometown** from the approved person birthplace city/state.
- **Base** from the current, source-linked in-game operating base when established; otherwise show **1999 BASE** or **CAREER BASE** with historical qualification. A locked 1999 base is not evidence of a person's exact 2014 location.

Gabe Larkin is linked in the existing Office prototype by canonical `P-000023`:
- Birthplace: **Jacksonville, Florida, USA** — `PG-0140`
- Recorded opening base: **Charles Town, West Virginia, USA (1999)** — `PG-0139`
- Citizenship and date of birth: **not established** in this source. Do not invent them.
- The Office's 2014 role remains its existing **Stable staff** label; do not silently overwrite that role with the 1999 participant's role.

## Data integration
The new `public/data/person-geography-ui-v33.json` is a compact **derived read-only UI projection**, not a people master. It references the original seven `data/geography/import/participant-*.json` files and retains canonical Person_ID, georecord IDs, source status, birthplace and locked opening/career base. Coverage: **1,308** unique people/birthplaces; **1,275** source-recorded base locations.

The People Profile lazy-loads the projection on first open, and joins by explicit Person_ID. Legacy name-only fallback is accepted only if the name uniquely identifies exactly one record. Distinct people with the same name are never conflated.

The country flag set is extended to all 16 countries found in the person birthplace source, using the existing licensed vector artwork. Mobile layout wraps identity details without adding a horizontally scrolling screen.

## Tier 2: Relationship Network
The People Profile has a separate **Network** tab and a compact Network entry on the Tier 1 Reputation panel. The detailed view allows:
- strongest-to-weakest / weakest-to-strongest / alphabetical sort
- filtering by counterpart profession
- paginated, one-screen relationship rows
- selected relationship notes, observation date and source references
- distinct relationship scores from global professional reputation

**Source adapter:** `state().staffState[personName].relationship_reports` may expose observed records:
```json
{
  "counterpart_id": "P-000123",
  "counterpart_name": "Person name",
  "counterpart_role": "Trainer",
  "score": 73,
  "sentiment": "positive",
  "observed_at": "2014-07-15",
  "summary": "Evidence-backed relationship observation",
  "source_refs": ["GAME_EVENT_ID"]
}
```
This is a shape example, **not** an actual relationship or rating. Every displayed record requires a source reference. Relationship sentiment can be supplied by the playability system; UI does not invent positivity thresholds or reveal hidden pairwise latent affinities. The current Office pilot contains no such observed relationship reports, so it honestly shows zero assessed relationships until the game supplies them.

The original `staffState[name].trust` is a separate working relationship signal and remains displayed separately from global industry reputation.

## UI controls / status
- Main People Overview remains dense, with Professional Attributes, Reputation & Network, Career & Opportunities.
- The separate Network view is a **Tier 2** detail tab reached from the main screen.
- Large networks use 8-row pagination rather than scrolling the full screen.
- No changes to the game kernel, generation algorithms, save format, or historical canon are part of this UI update.
- CI passing validates source structure, logic and regression; actual logged-in desktop/mobile pixel signoff remains separate.
