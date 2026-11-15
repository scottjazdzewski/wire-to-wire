## Wire to Wire — Commercial Software PR Checklist

### What changed and why?
State the affected screen/engine/data/asset behavior, the canonical source of truth, and the approved baseline preserved or the expressly reviewed replacement.

### Required desktop-offline declaration (checked automatically for every PR)

Desktop compatibility assessment: Explain how this PR fits the ONE locally installed Windows game.

Local runtime and data: State which code executes locally and the source of bundled data/art, or `No runtime/data change`.

Save compatibility: State migration, export/import and existing-career effects, or `No save format change`.

Network dependencies: List any existing offline blockers and why this PR adds no required remote gameplay service, or `No additional network dependency`.

Offline verification: List exact actual browser/unit/Windows packaged tests run. Use `NOT YET DESKTOP CERTIFIED` if no real packaged Windows test exists; do not claim one.

### Desktop-first commercial delivery (required even while browser previews remain)
- [ ] The change is compatible with the future offline Windows EXE and its ONE local game engine; no new mandatory Cloudflare/D1/API/CDN/web-account dependency
- [ ] Required game data/art are available as bundled read-only resources or via a tested local offline adapter, with no remote-only gameplay path
- [ ] Any changed save/event format preserves older careers and portable `.wtwsave` migration; no browser-origin-dependent storage assumed as final retail authority
- [ ] If gameplay, data access, or packaging changed, described actual desktop/offline acceptance needed (not merely a green web deploy); unported dependencies are explicitly tracked
- [ ] No private history admin/correction controls, source credentials or developer environment are bundled as retail features

Desktop compatibility assessment / known offline dependencies:

### Mandatory for every engineering window
- [ ] Started from current `main`; checked for concurrent changes before merging
- [ ] There is one supported implementation; **deleted the obsolete implementation physically** (files, dead functions, CSS, old tests, stale instructions), or proved no replacement/retirement was involved
- [ ] Inspected imports, live `<script>`s, dynamic consumers, worker routes, command handlers and save formats before deleting any code
- [ ] Updated `docs/engineering/WTW_DEAD_CODE_RETIREMENT_LEDGER.md` for any retired functionality or still-needed temporary adapter
- [ ] Existing source IDs, historical records, named horses, racing outcomes, save/load, financial transactions and approved artwork are unchanged unless explicitly authorized
- [ ] If any approved logo, badge, hero, trophy, portrait or other image was added/replaced/removed, updated `ops/approved-visual-assets.lock.json` with the **exact verified blob SHA in this same PR** (never an unreviewed follow-up)
- [ ] No second UI, fake preview records, new CSS patch stack or retired Office/Manager screen
- [ ] Relevant shared UI menus work: compact VIEW dropdown, sorted/filterable table, keyboard-accessible independent scrolling and correct back/forward behavior
- [ ] Validated on relevant screen families, not only the page edited; checked real rendered screenshots where UI/art changes
- [ ] Ran tests and **actual browser QA**, including save/load where game behavior or data is affected; report any failed checks

### Evidence and review
- Screen families/records affected:
- Old path/symbol removed and exact replacement:
- Tests, actual Chromium steps, and screenshots:
- Save/load or migration risk:
- New or intentionally changed artwork and approval:
- Remaining compatibility debt with explicit retirement prerequisite:
- Rollback point:

Do not claim complete commercial visual approval based only on a green CI run. Do not modify the pinned visual asset lock merely to make an unauthorized art replacement pass.
