# Wire to Wire — 1999 first class-progression gate

**Gameplay status:** modeled career only. The January 1999 founding source world is unchanged and retains zero registered racehorses. This release admits no additional horse names, people, owner cash, historical races or facilities.

## First two explicitly enterable condition-book classes

| Modeled source condition | Eligibility from actual saved career | Minimum additional rules |
| --- | --- | --- |
| Maiden Special Weight | 0 career wins | Age, sex, physical location, care clearance, last result spacing, future conflicting entries, ownership permission, real jockey booking and available cash |
| Allowance — NW2 lifetime | 1 career win | The above, plus the non-winners-of-two lifetime rule |
| Allowance — NW3 lifetime | 1 or 2 career wins | The above, plus the non-winners-of-three lifetime rule |

**Not yet enterable:** Claiming and Maiden Claiming (actual claiming ownership transfer and price terms), Allowance Optional Claiming (optional claiming fork), Starter Allowance (prior eligible claiming start), Handicap (assigned weights), and Stakes (nomination and official condition gates). These continue to appear as condition-book proposals where applicable but cannot be opened as playable events.

## Daily progression

An actual maiden winner is labeled in the single career journal as a graduated winner. On weekly race-planning days, the same AI trainer and race-secretary agents inspect current horse wins, future booked entries, race/meet date, venue, distance, surface, fitness, travel and money, then select independent maiden and allowance events when there are at least **two** actually eligible local AI starters. No empty race is fabricated merely because a solitary graduate wants a start. If the winner field is too small, the trainer records why that allowance opportunity is pending. After enough graduates accumulate, its selected game-card NW2/NW3 event opens and races normally.

The existing 12-day prior-result rest rule now also protects against **two pending future entries within 12 days**, including different race dates. Jockey bookings continue to reject the same race, impossible cross-track travel and unaccepted mounts. AI horses may target existing away-circuit allowance fields only when shipping, housing, fitness and cash conditions pass; player-owned horses are never shipped or entered automatically.

## Limits and QA

The game is modeling potential 1999 race conditions, not reconstructing authentic 1999 race results, claiming transactions or historical purse payments. It uses the same source condition-book cards and game engine modules in Node and the deployed static browser; browser modules must pass the source-mirror drift check. Tests cover maiden-only exclusion, NW2 and NW3 win ranges, unsupported class refusal, overlapping future-entry spacing, player authorization, actual allowance race settlement, deterministic replay, saved finances and historical-source isolation.
