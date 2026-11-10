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

The primary `History` tab opens `/archive/?page=...`, served from the private Cloudflare D1 **read model**. Its source-directory name still says **2026-11-07 v3.37**, but that label is insufficient to infer a race-result difference. On **2026-11-10**, we compared the current Drive E/W/M 5,370 edition rows with the staged E export on audited core fields and found zero differences; then a separate read-only remote D1 job compared every stored race and top-three result by permanent ID with the staged export. It verified **5,370/5,370 races and 15,561/15,561 result rows, with zero ID/field differences**, including **223 genuinely quarantined/inactive editions** and **5,147 active editions / 15,441 active placings**. Run: https://github.com/scottjazdzewski/wire-to-wire/actions/runs/42891491897 . This is technical data parity, **not** independent certification of historical claims or a general claim that all H/S/P/awards have source parity. Current Drive E/W/M remains **QA PENDING**; do not treat internal/fixed schedule days, invented backfill IDs, or year-level personnel links as authenticated historic facts.

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

No independent master, no overwrite of UI ownership, no new WTW person/farm/horse identity, no forged financing or historic race results, no 1999+ scripted outcomes. The historical content/source-approval gate and 1999 organization projection import remain **OPEN**. The Nov 10 readback found no edition/result D1 delta requiring an incremental refresh at that checkpoint.


## November 10 follow-up — stale D1 active-status guard

**Defensive rule:** D1 status flags may become stale after a future Drive source revision. SQL `WHERE status NOT LIKE 'QUARANTINED%'` alone cannot enforce *newer* source holds. The Nov 10 readback confirmed **zero** of the current 223 held edition IDs were actually stored as ACTIVE in D1, but the extra ID-based site guard is retained to fail closed on future divergence.

**Read-only interim control:** `src/worker.js` uses `src/history-inactive-read-model.js`, a generated deployment-only projection of the existing 223-edition source-linked QA-pending exclusion list in `data/history-audit/qa-pending-v384-inactive-edition-ids.json`. Tests enforce exact source-list parity; it is not an editable master. On `GET /api/bootstrap` and `GET /api/seasons`, it suppresses those edition IDs *and their displayed result rows* from the active site read model, independently of stale D1 status. It computes displayed race/result counts from visible rows while retaining the D1 full year index, so an otherwise valid season cannot disappear when a sample race is held. The original D1 source rows, edit overlays, name audit, record-review queue, pedigree, and source workbooks are not deleted or rewritten.

The API exposes `historySource` with the dated D1 readback/parity report, the source export label, and Drive **v3.84 QA_PENDING** authority. The source file and D1 agree technically on their recorded rows; that does not convert reconstructed placings, partial careers, draft dates, or provisional names into historically authenticated evidence. If the Drive exclusion list changes, regenerate it from the approved history-source gate and review before publishing.

**Next product gate:** retain name overlays and audit decisions, verify authenticated History Coverage labels after deployment, reconcile unverified H/S/P/awards history and source QA, then publish reviewed **organization economic history** into the existing D1 only by approval tier. Do not blindly rerun the original import or generate an unnecessary all-record race patch. No additional master, no Office UI redesign, and no automatic result replacement.
