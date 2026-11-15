# WIRE TO WIRE — DESKTOP-FIRST INSTRUCTIONS TO ALL WORK WINDOWS
Effective November 14, 2026. One installed game, one repository, no competing web product.

## Copy-paste this message into every active work window

> Wire to Wire is being sold as an **offline-first Windows desktop game**, distributed with WireToWire-Setup.exe. Continue the current assigned workstream, but BEFORE coding read the newest main, AGENTS.md, docs/engineering/PRODUCT_WIDE_RELEASE_CONTRACT.md and docs/engineering/WTW_DESKTOP_FIRST_COMMERCIAL_ARCHITECTURE.md. Keep ONE approved public/next interface, ONE JavaScript gameplay engine, one canonical history/world and exact approved art. Do not add gameplay requiring internet, Cloudflare/D1, external API/CDN/AI, hosted sign-in or a website. Approved data and artwork must work from bundled local files and player careers must survive local quit/restart and updates. Desktop shell packaging is owned only by the desktop workstream (Issue #180); don't make another launcher. Do not rewrite approved UI or game logic. Use a fresh branch from the latest main, test, and report what you changed. Every PR must include a **Desktop compatibility assessment** explaining what operates locally, data source, save compatibility, remaining dependencies and actual test evidence. If no installed Windows test has run, say **NOT YET DESKTOP CERTIFIED**, not that it passed. Check main again before merging and don't bypass CI.

## Same goal for different workstreams

| Workstream | Desktop acceptance |
|---|---|
| UI | Existing approved screens work in bundled desktop window; local assets, menus, sorting, scrolling, DPI, record navigation. No remote-only UI. |
| Gameplay | Deterministic commands and race resolution run locally; game clock advances without external API. |
| History | Verified source-approved local read-only content database; no D1 API dependency in shipped play. Preserve missing/held records and exact IDs. |
| Naming / farms / personnel | Seeded versioned algorithms, authentic location/industry data, no network-required generation or separate truth ledger. |
| Art | All approved assets bundled with exact identity mapping and same-PR lock changes; no online image requirement. |
| Saves / finances | Durable per-user local data with atomic writes, backups, older-career migration and portable .wtwsave compatibility. |
| Desktop packaging | ONE Electron main/preload, secure local protocol, Windows setup exe, actual offline install/launch/save/exit/relaunch checks. |

## One owner for the desktop shell

Do not ask each chat window to build an EXE. The dedicated packaging workstream under Issue #180 provides the ONE shell. Other windows deliver compatible modules and local content adapters for that same shell. Development can happen via GitHub/cloud CI; local means the *customer's installed game* doesn't need an online service.

## Release proof and blocking rules

1. Every PR includes a concrete desktop compatibility assessment, relevant tests, current main SHA, rollback path, save/data/art risks and known offline blockers.
2. Release CI must actually package and launch the Windows app, disable networking and prove game screens, history, races and save/reopen work; web/Chromium CI alone is insufficient.
3. The repository administrator must enable required checks and disallow direct pushes to main (Issue #152). Documentation and automated checks are bypassable without protection.
4. No retail approval until Issue #180 and subsequent local data/save milestones are certified on a clean Windows computer.

## Verified brand source for the desktop app icon

Current in-game Wire to Wire mark: public/assets/wtw-office-approved-logo.png (referenced by the live top bar and sidebar in public/next/next.js). There is also public/assets/wtw-logo.png; do not swap it in by guesswork. Desktop packaging must derive and inspect multi-size Windows ICO from approved artwork, preserve original PNG bytes, obtain final icon approval, and bundle the icon inside the Windows installer. No finished desktop ICO was confirmed in the repository at this handoff.
