# Comanche Raceway — Owner-approved 1999 game identity

**2026-11-15.** The player-facing fictional game name for the existing **T-0061** facility is **Comanche Raceway**. The location remains **Sunland Park, New Mexico**, serving the **El Paso–Las Cruces region**. The game continues to use the existing physical facility/track ID, no invented extra track and no changes to its races, shipping coordinates, meet dates, track geometry, surface or past results.

The real-world **Sunland Park Racetrack** opened in 1959 and continued operating in 2026. Retain the *historical* Sunland Park source identity and its historical evidence as-is; the project is intentionally making a distinct **fictional gameplay rename**, not pretending real-world Sunland Park ever bore this name.

The Comanche Nation's extensive Southern Plains horse culture and military history included **West Texas and eastern New Mexico**, but the immediate **Paso del Norte / El Paso** area also has longstanding **Manso, Piro, Suma, Tigua, and Apache** connections. No ungrounded claim that Sunland Park occupies the Comanche Nation's exclusive or ancestral home. Avoid defaulting to feathered headdresses, pan-Indigenous patterns, religious symbols or sacred imagery as commercial racing-logo decoration. Future artwork should foreground horsemanship, powerful galloping horses, bold racing typography, New Mexico landscape and other carefully researched motifs; obtain owner approval and update the exact asset lock in a separate visual PR.

**Implementation:** `public/next/1999-track-program.mjs` and the 1999 founding site directory keep their sourced `name: 'Sunland Park'` with `gameDisplayName: 'Comanche Raceway'`. The live 1999 source adapter returns the playable alias with `historicalName:'Sunland Park'`; the game directory projects the alias while keeping canonical source records and player edit overrides. Does not rewrite `canon-mini.mjs`, track geography, real race results, the portable save schema or other world identities.

**Commercial default:** The released base is a wholly fictional generated universe. If T-0061 or this alternate-1999 fixture is used in optional historical/test mode, it gets the approved display name; the default fictional world must not silently import authentic real-world results or identities. Existing player-customized names override default identities and survive reload and export.

**Desktop compatibility:** Local bundled source files only; no network runtime dependency added. No actual installed Windows test in this PR: **NOT YET DESKTOP CERTIFIED**.
