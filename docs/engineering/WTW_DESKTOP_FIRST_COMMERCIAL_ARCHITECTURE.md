# WIRE TO WIRE — DESKTOP-FIRST COMMERCIAL PRODUCT ARCHITECTURE
**Architecture decision 2026-11-14.** Repository-wide engineering rule for every UI, gameplay, history, art, naming, save and release workstream.

## Decision: the game is installable offline-first Windows software, not a hosted game

**The sellable product is an installed Windows application** — a signed `WireToWire-Setup.exe` that installs and launches Wire to Wire locally. The eventual website is **only** for marketing, checkout, customer accounts if required, support, downloads and OPTIONAL signed software/content updates. No customer requires Cloudflare, GitHub, an external browser, developer tooling, or an always-on internet connection to start, continue, save and reload a career.

**Initial desktop container: Electron + Chromium for Windows x64** (evaluate ARM64 and macOS subsequently). This reuses the already approved Chromium-rendered `public/next/` interface, keeps existing JavaScript/ES module game logic and rendering predictable, and is the shortest low-regression path to an executable. Electron is a **packaged client runtime**, not a website pointed at a Cloudflare URL. It has a larger download/memory footprint than Tauri; benchmark the tradeoff with the real data and screens after the first packaged prototype. Alternative Tauri/WebView2 is a documented later evaluation, not a second parallel product.

**Proposed packaging**: `electron-builder` with Windows NSIS installer, code-signed before any public launch; optional update checks and cryptographically validated downloadable updates. The first milestone is a real offline desktop build, not a signed retail release. Packaging selection can be changed after a measured prototype, but never fork the game engine or UI.

### What is retained, not rewritten

- **One** existing `public/next/` OOTP/FM-style management interface; all approved layout, tracks, horse/farm/people dossiers, art, menus, scrolling, sorting, history rules and buttons remain contracts.
- **One** existing authoritative 1999 game engine and deterministic historical/fictional generation. JavaScript is portable; no translation into C++/C#/Rust merely to obtain an EXE.
- Canonical horse/person/organization/track IDs, historical provenance, name engines, geographical/travel logic, live career finance and race outcomes.
- `public/1999/engine/compact-career.mjs`: existing compressed, checksummed portable `.wtwsave` container, with explicitly tested migrations as future schema versions evolve.
- Current browser UI preview and Cloudflare D1 **remain developer/internal tools during migration**; neither is a runtime dependency for the retail build.

### Current verified gaps at decision time

- `package.json` is a Wrangler-based application with no desktop packager or Windows installer.
- `public/next/index.html` serves static JS/CSS from absolute `/next/`, `/1999/`, and `/assets/` paths and still mounts a **hidden Office action/data bridge**. Preserve it until its real consumers are migrated; do not bundle an obsolete second playable UI.
- Browser saves use IndexedDB (e.g. `public/next/1999-commercial-career-manager.mjs`), with portable `.wtwsave` export/import. This is a useful transition but not yet a desktop-owned save-file/backup manager.
- Historical `src/worker.js` serves D1-backed `/api/bootstrap`, `/api/seasons`, `/api/entities`, `/api/horses/:id`, `/api/geography/*` and other records. These are **not** available offline just because HTML has been packaged.
- `docs/commercial-world-save-architecture.md` already records limitations in scaling full simulation populations and committing full historical result archives. Packaging must not misrepresent those gaps as complete retail features.
- Existing tests use local HTTP and Chromium. This **is not** evidence of a self-contained Windows application: add actual installer/EXE tests.

## Target architecture — physical boundaries

```
CUSTOMER DOWNLOAD (future storefront site)
    |  signed, versioned WIRE TO WIRE installer
    v
WINDOWS APPLICATION (Electron; local Chromium process)
    |  bundled /next/ management interface and approved artwork
    |  strict preload/IPC API with secure context isolation
    v
ONE AUTHORITATIVE LOCAL GAME ENGINE
    |  clock, commands, race resolution, owners, trainers, breeding, finances
    |  immutable world seed + frozen generator revision
    v
LOCAL DATA LAYER
    |  bundled, versioned, READ-ONLY approved historical/content pack
    |  local writable per-career state, event log, race ledger, versioned backups
    |  portable .wtwsave export/import (including full race archives as integrated)
    v
PLAYER APP-DATA DIRECTORY (outside the installation, persistent across updates)

OPTIONAL NETWORK: download signed updates, new content, license/entitlement
verification only if the chosen retail policy requires it. NONE may silently
become mandatory for ordinary single-player gameplay.
```

### A. Desktop shell and one UI

- Add a `desktop/` runtime adapter and packaging configuration **without** moving or duplicating approved screen implementations. The shell starts the application window locally, serves bundled assets through a secure, standard app protocol (not a remote Cloudflare URL), handles full-screen, DPI scaling, file open/save dialogs and graceful shutdown.
- Keep only a minimal validated preload bridge. No unrestricted Node integration in game content, remote HTML, unsecured IPC, arbitrary filesystem access, external navigation or open internet listening server. Follow Electron's current security recommendations: sandbox, context isolation, limited capabilities, CSP, validated IPC.
- Existing browser preview can continue using local server or preview deployment solely for internal development, supplied by the **same build artifacts and engine source**. Never fork UI logic into separate website and desktop screens.
- An installer may contain multiple resources internally; it is still a genuine offline desktop EXE. A literal single-file portable EXE is an optional additional distribution form, **not** the core architectural constraint.

### B. Historical data lives on the player's computer

- Convert approved historical/D1 read models into a **versioned, signed or hash-verified local content snapshot** (SQLite preferred for indexed queries, plus manifests, image packs and safe migrations).
- Import from the existing authority pipeline at BUILD time, not by doing D1 requests every game launch. All source statuses, withheld editions, correct date uncertainty, immutable IDs and 1999 foundation relationships must survive export.
- Provide a `HistoryRepository` read-only interface to the UI with the same stable query semantics offline. The D1 admin/correction/review workflows remain private authoring infrastructure — do not ship privileged editing or operator credentials to customers.
- Future approved content updates may replace read-only content packs by version with signature/hash checks; never override a player's completed race results or generated descendants.

### C. Player careers live in per-user local storage

- Move the **durable state authority** from browser-origin-dependent IndexedDB to a versioned, desktop-owned player application-data directory with transactional database/save operations (e.g. SQLite + full portable `.wtwsave` exports). Preserve checksums, one-writer simulation commits, stable IDs, backups and compatibility gates.
- First preserve **import of existing IndexedDB/portable saves**. Do not clear browser data or replace live saves with empty careers. A temporary IndexedDB desktop profile is permissible for a non-commercial integration prototype if the exact import/export path is tested and the final desktop save authority remains explicit.
- The installed program/content is read-only; save files, screenshots and settings live under the user's app-data folder, never in the program directory.
- Use atomic transactions, auto checkpoint/backup, restore after forced exit, consistent full-race event/result archive, and readable export/import. Loading a damaged or older save should fail safely with recovery, never reset/rewrite it.

### D. No required internet during play

A freshly installed desktop build must run without a connection, from first launch to long-term career continuation:
- Open January 1999 and load approved tracks/personnel/horses/art.
- Open source-backed History, horse/track/farm/profile routes, names, trainer operations, races and financial effects.
- Advance time, simulate races, save, close the process, reopen, import/export portable backups, browse historical results.
- No `fetch('/api/...')` or Cloudflare Access gate may be invoked by a shipped gameplay path unless replaced by an explicit local data adapter. Remote services may only supply optional enhancements with a full offline fallback.

### E. Commercial release is an INSTALLER, not a Pages deployment

- GitHub remains source control and engineering CI. Cloudflare Pages/D1 remain private preview, authoring, test or future storefront services as appropriate. **A green website deployment is not a Windows release.**
- Add Windows CI to package, install and start the actual app, close it, reopen it with the same user data, and compare exact game state. No development-only localhost/Python/Wrangler/Cloudflare prerequisites.
- Before selling: code signing, malware/SmartScreen reputation review, update signature and rollback, installer/uninstaller integrity, supported Windows requirements, DPI/resolution performance, crash logs, data recovery and legally cleared assets/data.
- Initial license/payment fulfillment belongs in the storefront/distribution layer. Avoid compulsory always-online activation for the planned offline single-player product; any later policy needs an explicit separate decision.

## Engineering migration order and acceptance gates

**G0 — Permanent engineering contract (this document).** All new PRs must state how their code works in the desktop build and whether it introduces runtime network/Cloudflare/browser-origin dependencies. No new **required** hosted service is allowed in game code.

**G1 — Real Windows shell proof.** Package the current approved `/next/` screen into an installable EXE **without a remote URL**, with full original UI assets and top-bar commands. Start, resize, go full-screen, open and close. Identify broken absolute paths and repair once in a shared local asset adapter. This is a prototype, not release certification.

**G2 — Local World + History reads.** Publish a read-only, versioned historical data snapshot, backed by a local data adapter with the same approved records, source-status exclusions, exact-ID lookup and date evidence. All in-game History/profile reads succeed with network disabled.

**G3 — Durable local career.** Import existing saves, move authoritative events and career checkpoints to desktop-controlled storage; preserve the portable `.wtwsave` format. Force-close/reopen tests prove exact finances, race outcomes, game date, names and relationships.

**G4 — Engine and bridge separation.** Move any remaining game authority out of hidden Office/browser-only UI callbacks into pure shared engine commands; preserve one UI and physically retire obsolete bridge code only after parity and old-save migration tests.

**G5 — Genuine Windows retail build.** Install signed EXE on a clean Windows machine with no developer tools, play offline, save/reopen after reboot, export/import, update safely without erasing careers, uninstall preserving data unless the user explicitly deletes it, verify 1536×864 and 1280×800 and common DPI settings.

**G6 — Storefront, entitlement and optional updates.** Build marketing/checkout/download pages separately. Protect release downloads, sign artifacts, make update checks optional for offline play and keep payment details out of the local game engine.

### Workstream rules effective NOW

- **UI:** Existing screen components and visuals stay approved; build with a local asset scheme and desktop window constraints. Do not add remote-only pages, CDN dependencies or website navigation as the only way to use a game feature.
- **Gameplay:** Pure deterministic engine modules; browser/desktop adapters are thin and have no independent rulebooks. Never require D1 or a web account to advance time, enter races or hire trainers.
- **History:** Continue research/admin approval as needed, but produce a build-time READ-ONLY local content pack for players. Source/admin review is not bundled in retail.
- **Naming/industry:** Every long-run generation step must work locally and deterministically from frozen seeded versions, without a required AI or network service.
- **Art:** Only approved, locally bundled assets, exact-blob lock, stable canonical IDs; no external image hotlinks required for primary UI.
- **Saves:** Versioned local snapshots/events, backup before schema migration, import old careers, recover interrupted writes, no web-origin dependency as final authority.
- **Release/QA:** Two separate gates: legacy browser-preview checks during migration, and **actual packaged Windows offline application** checks before any customer release. Never claim a fully shippable EXE when only browser tests passed.

## Scope limitation and handoff

This architectural decision **does not itself produce an EXE**, convert D1 or migrate IndexedDB. It changes the destination and the next engineering priorities. Do NOT simultaneously rewrite the current /next/ interface, game engine, historical canon or UI visuals. Implement G1–G5 in isolated tested branches and preserve the existing one playable game as modules migrate.

**Authoritative related contracts:** `docs/engineering/PRODUCT_WIDE_RELEASE_CONTRACT.md`, `docs/commercial-world-save-architecture.md`, `docs/HISTORY_SINGLE_CANON_SOURCE_POLICY.md`, `ops/approved-visual-assets.lock.json`.

Official background: https://www.electronjs.org/docs/latest/tutorial/distribution-overview ; https://www.electronjs.org/docs/latest/tutorial/security/ ; https://www.electron.build/v26/docs/targets/ .
