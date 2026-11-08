# Fictional Horse Name Pipeline

## Purpose

Create believable game-only Thoroughbred names with the range found in real racing: concise names, regional references, wordplay, lyrical phrases, commercial-sounding names, historical echoes, and unusual but natural expressions. Avoid formulaic combinations and repeated naming clusters.

## Separation rules

- Historical names come only from source-backed archive identities. Reconstructed/backfill names and pedigree-support names are not a style seed.
- Fictional candidates have their own IDs and records. They are never inserted into historical canon or used to fill missing historical identities.
- Every candidate is labeled provisional until reviewed. Never imply that an internally collision-screened name is cleared by the Jockey Club or another external registry.
- Keep an auditable record of which candidate was accepted, rejected, or edited. Use owner feedback to tune style without reusing rejected names.

## Batch workflow

1. Build a varied candidate set from multiple naming approaches; do not assemble every name from the same short word lists.
2. Normalize case, punctuation, apostrophes, accents, and spacing, then check exact collisions against all archive names and all prior game names.
3. Flag near-duplicates and repeated distinctive words or phrases. Review possible true historical name reuse by identity and year; do not merge horses just because a name matches.
4. Review the mix for naming realism, pronunciation, spelling, length, repetitive structures, and accidental references to real people or properties.
5. Only after review, assign permanent fictional horse IDs and mark each record as fictional. Keep generated pedigree and game stats separate from historical data.

## Initial batch screening

Batch 001 contains 38 provisional names. The screen compared normalized names against the 3,856 names in the 2026-11-07 horse-master snapshot. Two exact archive collisions were removed (“Keep the Receipt” and “Small Mercies”). None of the remaining candidates reached a 0.84 normalized Levenshtein similarity to an archive name, and no content word longer than three letters appears more than twice in the batch.

This is an archive-only screen. The batch is not registry-cleared, not yet owner-approved, and is not loaded into the site or game database.
