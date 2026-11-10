# WTW — SINGLE CANONICAL HISTORY: SOURCE → SITE

**Control locked 2026-11-10.** This is an import/promotion contract, **not a new historical master**.

## Only one historical authority

The historical world is a single ID-linked canon maintained in existing WTW Google Drive authorities. The central identity, geography, 1999 organization and economic-history control is **WTW CANON REGISTRIES — 1999 START v3.3**:

- Registry: https://docs.google.com/spreadsheets/d/1Lhpe6DG1foQ2-zayQBg4bKpTtu4MP_itpM1zo2GRSEA/edit
- Existing tab `History_Org_Economic_Backstory`: `gid=122436628`, 108 `Organization_ID` rows, 99 linked historical stakes-season activities; the original source is **Drive**, not JSON or Cloudflare.
- `History_Engineering_Control`: `SINGLE-CANON-HISTORY-SITE-SYNC-20261110` and prior historical completion gates.
- Existing historical E (Edition Detail), W (Winner Ledger), M (Annual Master) **v3.84** are linked race authorities, still **QA PENDING**. Their existing Drive IDs are `1H-iCZPYAVfVp3zBgJLGAAhh2YXtZ_Z1Oo8ETsegC51M`, `1KQizTXaF2k75tECmmSkkMQUH0YfCcyl6_ycXpRNKcCg`, `1jRweDBVk1nWglt8K-lRI0NNOgrmdX8w_60JtzP0_3aY`. Keep H/S/P and approved names linked by immutable IDs, not copied display text.
- The verified 1998→1999 historical boundary stays an as-of handoff, not a predetermined post-1998 simulation.

Several existing Drive sheets are different **tables inside one logical WTW canon**, not rival histories. Historical source claims, QA holds and WTW-authored fiction have distinct status. No new horse names from this history lane.

## What the site's History tab actually reads

The 2026-11-10 navigation change directs the primary `History` tab to `/archive/?page=...`. The archive is served by private Cloudflare D1 tables populated on 2026-11-08 from the **2026-11-07 v3.37 working H/S/E/P/B export**. D1 is a site **read model**, not source authority; the old import had 5,370 race editions and 15,561 result rows and has *not* been synchronized with the later v3.84 historical corrections. The v3.84 source has 5,370 edition IDs, **5,147 active** and 223 quarantined/inactive. Do not infer 5,370 active races from the old site import.

The site also has **user-approved name overlays** (`display_name_overrides`), an append-only name audit, `change_requests` / `change_audit`, and geographic read-model data. **Never delete or overwrite those when refreshing history.** A site name edit is not an authorized source name change.

## One controlled publication path

1. Identify the latest Drive authorities, their immutable IDs, source checksums, and approved release statuses. Fail closed on QA-pending historical claims; **never auto-approve** results just because they appear in a working sheet.
2. Stage an exact-ID reconciliation **before writing D1**: changed edition/horse IDs, names, placements, dates, active/quarantine flags, horse-season links, pedigree edges, awards, and 1999 organization histories. Account for both new and inactive/retired source rows.
3. Require a reviewed historical canon promotion manifest with explicitly approved edition IDs, statuses, source hashes and reversible D1 patch plan. Preserve source-era date uncertainty and distinctions between year-level people associations and race-day credits.
4. Promote **incrementally into the existing** WTW D1 `wtw-canon-desk-db` only. Do **not** rerun the original empty-database importer. Do not create a second D1 database.
5. Verify exact-ID count and hash parity, 1922 Derby/Preakness/Belmont continuity, approved naming overlays, quarantine filters, and 1999 Kingsmere/Whitcombe separation. Export a rollback manifest before applying any changes.
6. Only after this verification can `/archive/` and the new History tab claim to represent the latest approved WTW canon. The Office UI window owns navigation and profiles; history engineering owns the source/canon gate.

## Organization economic-history import

The accompanying `data/history-source/canon-registry-2026-11-10/organization-economic-history.json` is **a private, version-labeled export of the existing Drive tab**, *not an editable master*. The source workbook/Sheet IDs are embedded. The compiler `scripts/build-history-org-projection.mjs` writes reviewable private D1 SQL and a manifest. It does **not** run SQL or mutate the website.

- Preserve existing `O-` IDs; never merge the separate Argosy company arms, Kingsmere with Whitcombe, or trainer with breeder.
- Respect `Approval_Gate`: existing source-based history, owner-approved narrative direction, and unapproved historical outlines must remain different.
- Prestige, trend, commercial appeal, peer reputation, and financial condition are **separate historical dimensions**, not fabricated dollar figures.
- The source records 108 organizations, 35 populated historical outlines, 99 with recorded owner/breeder stakes-season associations, 48 with existing finance profiles. This is not a claim that all 108 backgrounds are user-approved.
- Kingsmere Farm (`O-000061`), historical breeder `HP-B-02-006-3`, Whitcombe Family owner `O-000037`, and Arthur Bell trainer `P-000077` remain separate. Kingsmere is the elite long-term gold standard with a modest decline in momentum by 1999, **not a scripted bankruptcy**.

## Operational no-drift rule

**Drive approved history → source-versioned, reviewed export → same private D1 read model → website History tab.**

No independent master, no overwrite of UI ownership, no new WTW person/farm/horse identity, no forged financing or historic race results, no 1999+ scripted outcomes. The v3.84 race-data gate and remote incremental sync remain **OPEN**, even when the organization snapshot compiler is ready.


## November 10 follow-up — stale D1 active-status guard

**Problem:** The 2026-11-08 D1 import is older than the v3.84 Drive edition quarantine decisions. SQL clauses such as `WHERE r.status NOT LIKE 'QUARANTINED%'` protect only rows already flagged in D1. They are **insufficient by themselves** until a controlled D1 migration reconciles all edition statuses. In particular, a v3.84-quarantined race can still have an old `ACTIVE` status in D1.

**Read-only interim control:** `src/worker.js` uses `src/history-inactive-read-model.js`, a generated deployment-only projection of the existing 223-edition source-linked QA-pending exclusion list in `data/history-audit/qa-pending-v384-inactive-edition-ids.json`. Tests enforce exact source-list parity; it is not an editable master. On `GET /api/bootstrap` and `GET /api/seasons`, it suppresses those edition IDs *and their displayed result rows* from the active site read model, independently of stale D1 status. It computes displayed race/result counts from visible rows while retaining the D1 full year index, so an otherwise valid season cannot disappear when a sample race is held. The original D1 source rows, edit overlays, name audit, record-review queue, pedigree, and source workbooks are not deleted or rewritten.

The API exposes `historySource` identifying the D1 snapshot as the **2026-11-07 v3.37 working export** and the exclusion authority as **v3.84 QA_PENDING**. This is not approval of v3.84 winners, placings, dates, names, or full career totals. Do not report new overall results as synchronized just because the exclusion overlay is active. If the Drive exclusion list changes, regenerate it from the approved history-source gate and review before publishing.

**Next promotion gate remains unchanged:** exact E/W/M delta reconciliation, rollback manifest, approved source updates to the *existing* D1, preservation of name overlays and audit decisions, and authenticated site checks. No additional master, no Office UI redesign, and no automatic result replacement.
