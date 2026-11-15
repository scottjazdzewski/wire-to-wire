# WIRE TO WIRE — INSTRUCTIONS FOR ALL ENGINEERING AGENTS & CHAT WINDOWS
**Product destination:** installed, offline-first Windows desktop horse-racing management software sold to customers. The future website is a marketing, checkout, download and support channel—not the game runtime.

Read these **before touching any code**:
1. `docs/engineering/PRODUCT_WIDE_RELEASE_CONTRACT.md`
2. `docs/engineering/WTW_DESKTOP_FIRST_COMMERCIAL_ARCHITECTURE.md`
3. `docs/engineering/WTW_DESKTOP_WORKSTREAM_HANDOFF.md`
4. The applicable approved UI/history/identity/save contract for your assigned workstream.

## Non-negotiable rules

- Work in **one** GitHub repository: `scottjazdzewski/wire-to-wire`. Inspect latest `main` every session and again before proposing a merge. Other windows work simultaneously: branch narrowly, compare current main, preserve all other workstreams.
- All new features must run inside the **same installed local Windows EXE**, using the **same authoritative game engine** and **one approved management UI**. Do not introduce a competing website game, separate Electron UI, alternative simulation, or required Cloudflare/online-only feature.
- **No required network calls at player runtime.** Do not make new gameplay depend on hosted `/api/` or D1/Workers, external CDNs, AI services, sign-in, or a remote website. Optional development previews and private historical ingestion may continue; all shipped gameplay must have a complete local implementation/data source.
- All game data used by customers must be bundled and versioned in a read-only local pack or generated deterministically from bundled seeds and algorithms. Exact historical IDs, approved source statuses and date uncertainty must survive. Never invent missing results/awards for offline presentation.
- Player careers and race outcomes must persist under per-user local application data, across program close/reopen, Windows reboot and installer upgrades. Preserve the portable `.wtwsave` format and plan migrations from current browser IndexedDB. Never destroy a previous save or reset on load failure.
- Preserve existing approved profile layout, logos, track art, dense sortable/scrollable screens, back/forward between **peer records** and all game behaviors. Don't reintroduce old Office UI; physically retire old functionality only after parity is certified.
- Use `public/assets/wtw-office-approved-logo.png` as the **current in-game Wire to Wire brand asset**. Windows `.ico` derivation and final brand-icon approval belong to desktop packaging; do not use arbitrary track/horse/owner logos as the app icon. Any modified visual assets require same-PR exact approved-asset lock updates.
- New desktop work is isolated under `desktop/` and thin adapters; keep `public/next/` and game modules shared until legacy browser dependencies are replaced. Electron is the initial chosen shell, not a new game engine.
- The Cloudflare website remains an **internal preview/research tool only** during migration. A green deployment, browser smoke test, or 10k kernel save cycles is **not** proof that a Windows installer runs correctly offline.
- Every feature PR must give a **Desktop compatibility assessment** stating which data/logic is local, what is still cloud- or browser-origin-dependent, how the user can run it offline, and which tests prove that. Flag outstanding migration dependencies honestly, rather than claiming retail readiness.
- Every desktop milestone must produce a real downloadable Windows installer artifact and run an installed-app open/close/reopen test on Windows with internet access disabled; before that, mark the milestone **NOT YET DESKTOP CERTIFIED**.

## Standard completion report (every engineering window)

Report: latest main SHA used; PR link & exact changed paths; what was added/deleted; desktop/offline compatibility assessment; local data/store dependencies; Windows packaged test status (**PASS / NOT YET AVAILABLE / FAIL**); browser tests; save migration impact; asset lock and UI regression checks; remaining blocker. Don't claim a merge or an EXE until GitHub confirms it.

**Release coordination:** do not bypass required checks, edit another window's branch, or merge incomplete milestones. Ensure branch protection/rulesets and required CI checks are enabled by the GitHub administrator. See Issue #152 for enforcement and Issue #180 for the first real installer.

**Important:** Development code can still be written from different computers/cloud development windows and committed through GitHub. "Local" describes where the shipped player's game, approved records, engine and saves run—not where a developer types code.
