# WTW 1999 track-specific condition books — game integration

The existing 118 U.S., Canadian and Cuban playable tracks continue to use the
established calendar and their immutable historical track identities.

- One deterministic condition-book engine drives both local browser and server
  1999 generators (no parallel simulation logic).
- Explicit track tiers: PREMIER, MAJOR, REGIONAL, LOCAL, FAIR, GROWTH (fictional
  tracks), and REVIVAL (alternate-history continuations).
- Meet-specific card sizes, class mixtures, claiming prices, age/sex conditions,
  dirt/turf selection, distances and class-specific 1999 USD purse ladders.
- A named stakes event takes one of the numbered races within its host card.
  The race includes \`stakeId\` pointing to the unchanged stakes identity and
  uses that event's existing purse and race conditions where available.
- Race cards are WTW proposals, not historical 1999 overnight entries. They
  have no automatic starters, weight declarations, results or fabricated wins.
- The 93 source stake records remain unchanged; the existing 1999 race-date
  correction overlay determines their projected calendar placements.
- The 87,500-horse game population, 118 playable tracks and all other screen
  components remain unchanged.

QA: \`tests/1999-track-condition-book-engine.test.mjs\`.
