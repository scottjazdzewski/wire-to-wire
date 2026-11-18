# WIRE TO WIRE — Local Trainer Employment Market (1999 Game)

This milestone turns the previously advisory trainer-career pressures and negotiation system into **real owner-authorized horse-to-trainer employment moves**, respecting the single game save, financial ledger, existing trainable horses and physical racing barns.

## What is now operational

The read-only `getLocalTrainerHiringMarket(state,world,horseId?)` lists a player's currently registered horses, current trainer, available **approved and already operating** neighboring trainers, actual staffed same-track barns, modeled daily rate and capacity, any current offer, and sustained departure warnings. These are game-only modeled prices and dispositions, **not historical facts** about approved human identities.

A player sends `OFFER_LOCAL_TRAINER_ASSIGNMENT` naming an actual owned horse, selected approved trainer, actual alternative barn, and integer daily service fee in cents. A model trainer accepts only at their applicable minimum (or the exact existing owner's signed terms). A signed acceptance is stored as an employment offer and **takes effect on the following game day**. Unaccepted wage offers are recorded without changing the horse. The owner can `WITHDRAW_LOCAL_TRAINER_OFFER` with the exact offer ID before the change takes effect.

**The racehorse and training record move atomically** at the beginning of the effective day, after actual shipped horses return/arrive and before the real owner/trainer contracts, daily boarding/wage charges, workouts, and race agents. The horse retains its history, age, pedigree, career races, conditioning and owner; only active trainer and same-track physical racing barn change. Original race results and trainer attribution are never rewritten. The new signed trainer terms start with the assignment; there is no imaginary signing bonus, penalty, transfer payment or cash created. Boarding and trainer costs accrue from the authoritative existing daily ledger as the service is performed.

A trainer **can hold multiple clients**. Replacing the last horse owned by one client ends only their contract for that owner, with its dated terms preserved for future re-hiring. The person remains employed by any other clients. No source person ID changes and the outgoing trainer does not automatically disappear. If there is no qualified alternative with space or financing, the horse stays with its existing trainer. This is not an instantaneous global firing market.

## Safety and geographical rules

- Only the actual player owner can authorize a change in their stable. AI owners cannot change the player stable.
- Candidate trainers must already have modeled training skills and be operating a real staffed and active track trainer barn **at the horse's current host track**. Known home facilities without a matching physically present replacement are not magical remote assignments.
- Stall occupancy includes resident horses, reserved contractual stalls, and away visitors in outbound/arrived transit. A move cannot overbook.
- No horse can change trainers while a booked/entered live race, away/outbound/return travel, or temporary recovery/workout order is pending.
- Owner financing must support at least seven days of agreed trainer service for the candidate's resulting total client herd. Decline/withdrawal has zero cash effect.
- When plans change after an offer, the effective-day reassessment can cancel an unsafe move rather than force the original promise through changed eligibility, cash, capacity, or wages.
- A repeated severe saved trainer relationship can create an explicit **departure warning**. For the player, this never automatically reassigns a horse. AI owners can arrange an actual nearby replacement under the same capacity and cash rules; even an AI trainer may not resign leaving an untrained horse.
- All commands use the single canonical command-receipt journal and existing save validation. Older valid careers remain importable.

## Boundaries and upcoming work

This is **local same-track employment V1**. Cross-country relocations, new permanent trainer businesses, recruiter-driven global moves, formal severance, and a cross-owner auction of staff are not simulated by inventing teleportation or undocumented cash charges. Those require a later physical relocation/hiring contract model. Existing generic Decision Desk screens are not redesigned by this engine-only milestone; the read-only market selector can be surfaced in Personnel in a separate UI workstream.

**The next gameplay priority returns to actual horses and races:** realistic condition-book placements, jockey choices, race tactics, workouts, postrace feedback, eligibility, and campaign progression. Employment engineering is not to displace horse/race gameplay again.

Verification: `node --test tests/1999-local-trainer-employment-market.test.mjs`; full source/game and Canon Desk regression suites; canonical-to-browser mirror parity, persistence, actual Chromium career/restart and release integrity workflows.
