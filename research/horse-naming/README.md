# WIRE TO WIRE — Semantic Horse Naming V1 (Nov 13, 2026)

**Status: implemented and locally tested, but deliberately not deployed.** This branch is an isolated prototype of a new primary name-generation architecture. It does not rename horses, register names, modify the 1999 game, or call a paid model without a configured server-side API key.

## Why this exists

The previous **v4.54** engine numerically supplied 165,000/165,000 unique provisional names in each of two independently seeded three-year tests. It was **not quality-approved**. Three factory methods accounted for almost 78% of the final 2002 World B cohort: `v451_two_imagery` (21,692/55K), `v451_long_dialogue` (10,703), and `v451_single_fused` (10,497). They produced arbitrary combinations such as *Proper Croissant*, *I Bought Our Screw*, and *Theywonourhalter*. Grammar filters and source switching did not address the root cause. The v4.55 diversion experiment lowered supply and failed.

This implementation eliminates those factory methods **from the new architecture entirely**. It delegates whole-name creation to a configured creative language model and independently evaluates the result, then enforces racing reference, era, name-reservation, source-diversity and phrase repetition checks. There is NO fallback to the unreviewed v4.54 factories. A failed event is reported as **held**, not counted as a named horse.

## Code

- `semantic-horse-names.mjs`: event briefs, protected-name screening, independent review contract, concurrency-safe reservation, source diversity, 18-character limit, canonical-horse protection, name preview ledger and compatibility callback for existing WTW preview bridges.
- `model-provider-v456.mjs`: server-only OpenAI Responses API adapter. Uses strict JSON schema. Separate configured creative and reviewer model IDs are required. API key is never in a browser, repository, or log. No default secret/model is assumed.
- Tests: Node's built-in test runner, with **mock creative and reviewer responses only**. No paid model call is made by running tests.
- `FULL_REAL_CORPUS_PROBE.json`: independent check using 19,719 distinct real names from the user's **4,167-race** source. The original real-name list is stored in the companion research ZIP and should be loaded from authorized data in production, **not copied into publicly accessible source code**.

## Integration example (server only)

```js
import {createSemanticHorseNamingSession} from './semantic-horse-names.mjs';
import {createResponsesNamingProvider} from './model-provider-v456.mjs';

const api=createResponsesNamingProvider({
  apiKey:process.env.OPENAI_API_KEY,
  creativeModel:process.env.WTW_CREATIVE_MODEL,
  reviewModel:process.env.WTW_REVIEW_MODEL
});
const session=createSemanticHorseNamingSession({
  protectedNames:await loadRealAndCanonicalProtectedNames(),
  alreadyUsed:await loadSaveRegisteredAndReservedNames(),
  proposer:api.proposer,
  reviewer:api.reviewer,
  maxRounds:4
});
const rows=await session.previewBatch(raceReadyNameEvents.slice(0,25));
// rows have status PROVISIONAL_QA_PASSED or HELD_*.
// None are registered or saved to a horse record here.
```

`loadRealAndCanonicalProtectedNames`, `loadSaveRegisteredAndReservedNames` and `raceReadyNameEvents` above are **application-provided** functions/data, not included in this research branch. A production implementation must connect the existing WTW registrar, ownership facts and racing-readiness gate before naming is active.

## Quality criteria

1. **Named only at readiness**, not at foaling. Preserve Horse_ID, sire/dam and historical entries.
2. Domain selected first. A pedigree, owner-family, location, private joke or foreign-language domain can only be requested when that information is truly supplied. Never invent historical owner preferences.
3. Complete original name proposals, no arbitrary token grids. Real registered names remain screening/reference data, never output seeds.
4. Local exact/one-character-normalized similarity exclusions against all registered and game-used names, plus current-name reservation across previews and years. The 19,719-name set is **not** complete Jockey Club name clearance.
5. Independent semantic review required (4/5 minimum, explicit grammar/human-believability/originality/era booleans). A separate actual blind human evaluation remains **required** before deployment; automated review is not self-validating.
6. Source-domain share alarm of 20% (after a sample threshold) and five two-word-openers cap at 8% among 3+ word names. These are provisional guardrails, not a historical census.
7. **No numeric success substitution.** A held or reviewer-rejected event is not a successfully named horse. An unavailable model/reviewer causes no registered naming.

## Tests and proof boundary

`node --test *.test.mjs`

The local tests verify exact/near name rejection, canonical names left unchanged, chronology, reviewer rejection, malformed/incomplete API responses, concurrent reservation, repeat-event stability, phrase-template rejection, provisional sync bridge handoff, and source-domain constraints. The **real protected-list probe** verified 19,719 unique names, exact collision hold, one-edit hold, no canon write. The reviewer in all tests was a **mock**, and no live creative provider was called.

**NOT VERIFIED:** ability to produce 55K believable names/year, three consecutive 55K naming years, 90% blind human approval, a Jockey Club official name-availability check, sustained cost/latency, real owner-profile distribution, or production world/registrar integration. Do not publish as complete until tested on real model output with independent human review and two full 165K runs.

## Preserve old source

The authoritative last *numerically* complete engine is the existing **v4.54** research package, separately stored in the user's `WIRE_TO_WIRE_NAMING_RESEARCH` Library folder. The v4.55 source-diversion attempt is REJECTED. Neither package should be altered by this prototype; this branch is isolated from `main`.