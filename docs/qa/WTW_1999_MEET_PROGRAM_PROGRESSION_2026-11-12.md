# Wire to Wire · 1999 meet-program progression

Scope: the current shared 1999 condition-book engine only. No UI redesign,
canonical race histories, population counts, horse identities or result commits.

## Horse cohorts

The conceptual world is approximately **350,000 total horses**. The existing
1999 game currently indexes 325,000 total world horses and 87,500 registered
racehorses. These are not the same as active, fit, rested, age-eligible runners.
Weanlings, yearlings, retired runners, broodmares and stallions must never be
automatically counted as today's race-ready entries.

Race cards remain proposed fixtures pending explicit race-ready runner availability
and race-entry logic; this patch does **not** infer eligible runner demand from
the total world population.

## Program evolution inside existing meet windows

- Per-meet `meetNumber`, `meetWeek`, `meetPhase` and `weeklyProgramTheme`
  are calculated deterministically from each track's actual/modelled 1999
  meet bounds. Separate spring/fall meets reset independently.
- Opening → Development → Championship → Closing phases.
- Six rotating weekly condition-book themes: maiden development, sprint speed,
  route tests, allowance ladder, claiming market and distaff program.
- Weekly themes and prior card conditions influence class selection and avoid
  immediate class repeats. Claiming bands and N2L/N3L allowances vary.
- Early-calendar cards exclude 2YO races; juveniles enter as spring/summer
  progresses. Juvenile sprint distances are shorter early, with controlled
  route options later in the season.
- Race count is still track-tier / weekend / existing stakes driven (6–16
  slots), not multiplied by population or expected entries.
- Named stakes always preserve their published/game-authoritative dates,
  purse, number and identities, with no posted results or fabricated entries.

Source of truth: `public/next/1999-condition-book-engine.mjs`, consumed by
both browser and server 1999 generators. The 118-course playable region,
world population, calendar profiles and UI are unchanged.

QA: `tests/1999-meet-program-progression.test.mjs` plus existing every-stake,
all-track, and browser/server consistency tests.
