# Wire to Wire — on-demand fictional naming V8 (legacy)

**For new integrations use [V11 compact indexed naming](fictional-indexed-naming-v11.md).** V8 keeps an expanding in-checkpoint naming history for backwards compatibility; V11 stores names in an external registry and returns only a compact cursor.

## Purpose

Generate believable fictional horse-racing identities **when requested**, and
reuse established owners rather than creating a new syndicate for every horse.
V8 is a thin pure-state wrapper around the existing fictional-world name factory,
not a second name generator, new UI, new world population or save writer.

## Racing-card evidence consulted

Two real TimeformUS Keeneland racecards accessible in the racing workspace:

- October 30, 2026: 10302026TFUSKEE99.pdf — 124 owner rows, 124
  trainer rating rows and 124 jockey entries.
  https://drive.google.com/file/d/1OawR4iW6DxfvoZSuzYcO68Uy-r2rRQW9/view?usp=drivesdk
- October 31, 2026: 10312026TFUSKEE99.pdf — 151 owner rows, 152
  trainer rating rows and 152 jockey entries.
  https://drive.google.com/file/d/1F_LL18Pq_G8n6r2CRdytdJhaY44RHj-K/view?usp=drivesdk

The 275 printed owner rows include a mixture of named individuals, family
stables, private racing firms, LLC/Inc. suffixes, farm/stud owners, co-owners,
formal partnerships, syndicates and international racing companies. Among the
rows, 96 contain corporate-style suffixes, 46 contain explicit "and" or "&"
presentations, and at least 50 look like sole personal ownership. These pattern
counts overlap. **134 of 275 owner rows are truncated with ellipses.** They are
not a reliable measured breakdown of ownership type. The 2026 sample guides
plausible *name structure* only; it does **not** establish 1999 distribution
percentages or evidence of legal group membership.

Actual owner, trainer and jockey names from the PDFs are never bulk imported
into the fictional lexicon. The Timeform-style first-initial plus surname is
offered only as an optional display abbreviation; full personal identities are
preserved with accents, compound names and correct primary family surnames.

## Ownership choices

V8 distinguishes INDIVIDUAL_OWNER, FAMILY_OPERATION,
PARTNERSHIP_OR_SYNDICATE, CO_OWNERS, FARM_OWNERSHIP,
RACING_COMPANY and PRIVATE_RACING_OPERATION.

These are **naming-archetype labels** only. They do not assert a legal
corporate registration, actual co-owners, farm control, or inherited holdings.
The organization candidate generator no longer invents unrelated people
as business partners to fill out a new name.

The existing organization name factory accepts two optional controls:

- ownerPartnershipLimit — a hard limit on **newly invented** formal partnership,
  syndicate, racing club or group titles in that batch;
- soleOwnerPercent — an editorial individual-owner mix override. When omitted,
  the prior V7 full-world generator keeps its established behavior.

The existing fictional-world factory can pass an ownerNamingPolicy with
partnershipLimit and soleOwnerPercent. No source/canonical owner is renamed.

## On-demand session

The new exported function generateOnDemandFictionalNames accepts:

- worldId and seed (required), and 1999 opening era;
- state (optional for first call, required to continue the same name registry);
- roles, owners, facilities, protectedNames, markets, and country/colony mixes;
- maxPartnershipGroups (default **128** per world session), set at first call;
- soleOwnerPercent (default **23**, editorial rather than historical).

It returns people, owners, stables, farms, trainingCenters, programNames,
names, manifest, ownership, and **nextState**.

Persist nextState in the caller's own game save. When generating again, pass
that state to prevent issuing the same normalized name twice or exceeding
the world-wide partnership cap. Each step is deterministic and has a distinct
batch namespace. The built-in naming registry checks historic protected
names and names already issued, ignoring punctuation, accents and case while
preserving native visible spelling.

Ownership results additionally expose newPartnershipGroups,
reusablePartnershipGroups, reusableOwnerCount, archetypeCounts and the
remaining number of permissible *new* partnership titles.

There are two pure lookup helpers:

- listReusableFictionalOwnershipGroups(state, options) — find previously
  generated syndicates/partnerships with their stable IDs and region.
- listReusableFictionalOwners(state, options) — find existing individual
  owners, private businesses, family operations and groups, optionally by
  naming archetype or region.

**Reusing an existing owner does not mint a new organization.** The game
decides when an owner acquires a horse; this naming module does not assign
horses, create family ownership facts or save any data.

An initial call with 30 owners can be followed by another call with 10 owners,
or by reusing one of the 30 identities directly. A saved session with
maxPartnershipGroups=12 can issue only 12 new formal partnerships in total,
even if thousands of subsequent individuals and private companies are minted.

## Tests and integration rules

Run tests/1999-fictional-on-demand-names-v8.test.mjs. This exercises 12
sequential requests totaling 960 owners with a limit of 12 new partnerships,
duplicate protection, individual/family/company variety, existing owner reuse,
program abbreviations, replayability, malformed input, and a separate
1,100-owner single-world test with a 20-partnership cap.

All name-generation functions are synchronous, pure and **write nothing to
the current game world**. The caller must save nextState and commit any
entities transactionally. Concurrent calls from stale copies of the same
state must be serialized externally by the game/save coordinator.
