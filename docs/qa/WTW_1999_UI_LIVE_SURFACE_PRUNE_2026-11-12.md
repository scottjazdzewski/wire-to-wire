# WTW 1999 Website — live-surface cleanup (2026-11-12)

**Scope:** Only the existing Office/FM website. Do not modify the gameplay engine, source IDs, saved authority, race simulation or approved artwork.

## What was actually removed

- **231 entirely unused CSS rules** from `public/next/next.css` (26,893 characters removed). These belonged to retired header, horse-attribute, stable, profile and search page variants that are not rendered by any of the 17 live scripts/markup dependencies.
- Three JavaScript functions with **zero call sites** were removed from `public/next/next.js`: `menuIcon`, `depCurrentMeetRows`, and `depTrackRaceRows` (1,820 characters). The last included dead `Preview Race` / `DEMO CARD` construction. The actual race-card calendar and engine condition books remain untouched.
- The approved detailed FM horse and role-specific personnel dossier paths, full source IDs, pedigree, attributes, logos, racing calendar, track pages, and breeding/facility views were retained.
- Refreshed live CSS/JS URLs to prevent stale browser-cached UI assets.
- Restored accurate separation between the **87,500-horse racing roster** and the **325,000-horse all-populations directory** in UI tests. These changes do not generate or alter either population.

Combined targeted UI code savings: **28,713 characters**; CSS 289,183 → 262,290, JS 297,300 → 295,480, measured at the prune commits. Production sources may continue changing in other windows.

## Safety decisions

**Do not delete:**
- `office-v30-1.js` through `office-v30-4.js` or `office-fm-v32.js` through `office-fm-v37.js` just because the legacy Office HTML is visually obscured. The current FM/1999 UI still uses these live dependencies for events/records, routing and saves. Remove them only when supported behavior has been migrated and verified.
- Any image, logo, trophy, asset index, canonical registry, historical ID mapping, pedigree or approved stylesheet rule with an active consumer.
- `1999-canonical-gameplay-bridge.mjs`: explicitly unmounted pending the other gameplay window's accepted release contract.
- `/1999/` test-app files or active tests merely because they do not render on `/next/`.

**Do not re-add:** A second horse or people profile, alternative simplified dossier, hidden preview race generator, or unreferenced large style block.

## Protected behavior and tests

- `tests/1999-ui-live-surface-prune.test.mjs`: verifies all script dependencies exist, old dead helpers do not return, retained live CSS/profiles remain, and simplified World horse/person routes stay removed.
- `scripts/1999-management-browser-smoke.sh`: follows Stable → horse profile, Breeding → VIEW Stallions → horse profile, Personnel → trainers/jockeys, World → canonical person profile, plus calendar and portfolio navigation.
- `tests/1999-profile-restoration.test.mjs`: requires one detailed profile per horse/person and role-correct attributes.

**Cleanup policy:** Before deleting a file or rule, prove no runtime/module/markup consumer and verify the full browser flows. Never remove something on filename age, unavailability in one view, or a guess about the other window's release.
