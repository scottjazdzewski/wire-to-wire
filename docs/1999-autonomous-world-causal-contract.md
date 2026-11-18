# Wire to Wire — autonomous 1999 world: daily causal contract

**Scope:** gameplay engine. Never a replacement UI, historical archive, or parallel simulation clock.

## Principle

The world must progress when the player issues no commands. Every active agent
makes a bounded decision for its domain, informed by its own ability, incentives,
financial circumstances, obligations, and what happened to the entities it can
actually influence. Events without downstream effects are not gameplay.

## Authoritative sequence (one `ADVANCE_DAY`)

1. Validate and clone the existing run; increment the **single** game date.
2. **Owner agents** assess actual cash, existing costs, horse condition,
   ownership portfolio, horse potential and trainer trust; where authority
   permits, modify care and spending policy through the same authorized
   `SET_HORSE_CARE_POLICY` handler used for the player.
3. **Barn operators** assess staffed capacity, occupancy, physical quality,
   cash reserves, and welfare obligations; use existing staffing/maintenance
   actions rather than creating unregistered facilities or fictitious resources.
4. **Trainer agents** choose a named daily workout for each assigned horse from
   fitness, fatigue, soreness, age, training goals, skill and owner constraints.
   Explicit player directions are respected except for the welfare rest gate.
5. Process actual facility upkeep, payroll and any rent from the existing
   account ledger.
6. Process each registered horse's workout, condition response, feed/care,
   charged owner cash, and provider income once via the existing development
   engine.
7. Reconcile owner–trainer trust and support from **what was paid and delivered**,
   not from a fictional narrative or a guaranteed improvement.
8. Deliver time-dependent events from the existing scheduler and validate the
   entire run before accepting the command.

A retried command ID with the same payload is idempotent. Save/reload must
reproduce the exact same decision outcomes and their causal explanations.

## Current active agents (V1)

| Agent | Owns the decision | Inputs that matter | Downstream consequences |
| --- | --- | --- | --- |
| Owner (AI) | Care/feed/budget | Liquid cash, projected burn, horse potential, welfare, trainer trust, fixed temperament | Cash paid, care actually supplied, trainer support, conditioning |
| Trainer | Day's workout | Trainer competency, horse age/fitness/fatigue, soreness, training direction, owner support | Workload, fitness, readiness, speed/stamina/gate progress, soreness risk |
| Racing-site operator | Staffing and maintenance | Horse occupancy, wages, operating cash, stable quality and welfare | Effective stall capacity, quality, care, payroll and horse recovery |
| Horse | Physical response (never discretionary financial agency) | Innate traits, soundness, training focus, actual exercise, actual care | Persistent current condition and next-day/race readiness |

Every change is linked to permanent **O-ID, P-ID, F-ID, H-ID** and the single
career date. Agent decisions have a **reason code** and the resulting horse and
finance changes are in the same saved journal. All values are declared modeled
1999 gameplay unless supported by a separate authorized historical source.

## Explicit limits of V1

This first layer does **not** yet grant autonomy to jockeys, vets,
bloodstock/breeding managers, race secretaries, transporters, buyers/sellers,
or track race schedulers. They need real underlying actions and validated
budgets/eligibility before agents can act. Do not add pretend decisions or
race results simply to make a profile look active.

## Mandatory contract for the next agent

An agent action needs these five parts:

1. **Actor and authority** — who can make the choice and whether the human
   player has explicitly reserved the choice.
2. **Information set** — what that actor knows *at this career date*, with
   no future results or invisible historical knowledge.
3. **Decision** — an actual legal game command or bounded production action.
4. **Ledger and consequences** — money, relationships, scheduling, location,
   welfare, training or an actual outcome that changes future decisions.
5. **Explanation and replay** — stable IDs, reason code, relevant input values,
   saved state and deterministic command replay.

Next sequence: first race entry/jockey availability and booking; race scheduling
with track staff/capacity; deterministic race results and purse settlement;
postrace recovery into the same horse-care loop; then the daily breeding,
veterinary and market agents. No agent may independently rewrite the layout or
seed synthetic historical source records.
