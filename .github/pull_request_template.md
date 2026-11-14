## Wire to Wire — Commercial Software PR Checklist

### What changed and why?
State the affected screen/engine/data/asset behavior, the canonical source of truth, and the approved baseline preserved or the expressly reviewed replacement.

### Mandatory for every engineering window
- [ ] Started from current `main`; checked for concurrent changes before merging
- [ ] There is one supported implementation; **deleted the obsolete implementation physically** (files, dead functions, CSS, old tests, stale instructions), or proved no replacement/retirement was involved
- [ ] Inspected imports, live `<script>`s, dynamic consumers, worker routes, command handlers and save formats before deleting any code
- [ ] Updated `docs/engineering/WTW_DEAD_CODE_RETIREMENT_LEDGER.md` for any retired functionality or still-needed temporary adapter
- [ ] Existing source IDs, historical records, named horses, racing outcomes, save/load, financial transactions and approved artwork are unchanged unless explicitly authorized
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
