# Wire to Wire — Founding 1999 profile templates (UI lock V1)

**Authority:** User-selected page pattern, November 13, 2026. Work only from latest `main` in `scottjazdzewski/wire-to-wire`. This is a **presentation and routing contract**, not a new entity, facility, horse, employment or financial database.

## VISUAL TEMPLATE AND IMAGE SLOT LOCK — NOVEMBER 13, 2026

This is an exact DOM/layout contract, not a loose visual style analogy:

- **EVERY people profile** (owners, trainers, jockeys, breeders, farm managers, stable workers and all future admitted personnel) uses the existing Horse `ng-profile-horse` chassis. One row of **four equal-width ability panels** (46 reserved blank slots: 9 / 15 / 12 / 10), then the **seven-slot condition/status strip**, **five office panels**, **two wider lower panels**, and **full-width summary**. Labels and ability ratings remain UNASSIGNED until the user approves role-specific attributes; zero scores are NOT implied.
- **EVERY facility and ownership profile** uses the actual Track `ng-profile-track` chassis: large four-column records table on the left, same width ratio as the Track page (1.23 / .77), right-hand **facility/operations**, and bottom-right **history**. Empty data preserve the same fixed panel areas; they do not collapse or produce a new independent layout. No source-free capacities, payroll, acreage or construction claims are introduced.
- **No old founding mock renderer**: `public/next/1999-founding-profiles.js` was deleted, its `WTW FOUNDING PROFILE TEMPLATES V1` CSS was removed, and both profile types are rendered only through `profileDetail()` and its `1999-restored-profiles.js` exact-ID source adapter. Preserve the shared original Track/Horse components, not a second copied page.

### Image generation dimensions and display presentation

| Asset class | Approved source master | Rendered profile slot | Treatment |
| --- | --- | --- | --- |
| Horse portrait | **1600 × 2000 (4:5)** | 72 × 90 desktop (4:5); 64 × 80 narrow mobile | Cover inside matched ratio; no squashing; same frame exists before image |
| Personnel portrait | **1600 × 2000 (4:5)** | 72 × 90 desktop (4:5); 64 × 80 narrow mobile | Same portrait frame as Horse, by immutable P-ID; no unrelated stock-photo fallback |
| Facility / farm image | **1600 × 1200 (4:3)** | Standard Track-logo header plate **214 × 108** | Contain entire source master (letterbox if necessary), never stretch/crop |
| Ownership-group crest/logo | User-supplied approved artwork (do not impose unapproved generation dimensions) | **Same 214 × 108 Track-logo plate** | Transparent/unmodified, `object-fit:contain` and no transform; identical approved source on Ownership and Facility views and next to owned horses |

### One-to-many logo propagation (critical)

The **only authoritative organization logo map** is `public/assets/office/founding-organization-logo-index.json`. Its `organizations` keys MUST be exact `organization:O-...` (e.g. `"organization:O-000014": "/assets/office/founding-organization-logos/O-000014.webp"` after actual approved artwork has been added at that path). No hypothetical files are pre-registered and no 108-organization legacy logo alias is allowed.

`organizationLogoMarkup()`, `approvedIdentityAsset()`, and `horseOwnerBadge()` all use the same approved **O-ID**. Every incoming or newly generated horse must store an exact `owner_id`, `ownerId`, `ownerOrganizationId`, or `ownershipOrganizationId` referencing an approved organization. The UI derives that organization's display name and logo from the approved O-ID; **never** infer ownership from breeder, foaling farm, boarding stable, trainer, name similarity, or historical associations. The same owner crest then appears beside the horse name across Office horse lists and on the Horse profile. If owner ID or image is missing, display an explicit placeholder, not somebody else's artwork. No artwork is claimed uploaded until its bytes and manifest entry are present.

Person and horse imagery use their original exact-ID `person:P-...` / `horse:H-...` entries in `public/assets/office/decision-photo-index.json` (or separately approved world-record photo URL); preserve existing approved portrait assets while accepting new properly indexed assets. No filename/name guessing.

### QA gates

- Browser-check all four Horse-equivalent personnel ability columns, 46 empty scores, seven status slots, five middle panels, two bottom panels and a visible portrait frame before any artwork arrives.
- Browser-check Track-equivalent full-height facility records, configuration and history together with the owner/facility image plate. Verify a single immutable O-ID across those pages and any horse badge.
- Image CSS must preserve both exact aspect ratios; empty slots never vanish.
- Keep **all 118 North American/Cuban racecourses**, zero international venues, and historical-only closure rules unchanged.


## Approved presentation system

**Ownership organization profiles — reuse the Track profile system.**
- Full-width identity header, exact-ID logo slot, location and organization type.
- Track-style two-column workspace and compact profile navigation.
- Major historical race/bloodline connections, leadership and investor roles, registered horse status, institution history and its source restrictions.
- Source year-level connections keep breeder, racing owner, and trainer meanings separate; never turn association into race-day earnings/ownership.
- Read `organizations`, `people`, `historicalAnchors`, and `horses` from the **same** `public/data/wtw-1999-founding-directory-v1.json`.
- Four pending names remain blank (Harrowgate, Huntcross, Argosy Racing Partners and Ledbetter Calder); Magic Johnson is a major non-operating investor, Julian Voss is Argosy Bloodstock's principal.

**Facility profiles — reuse the Track profile system, using the same organization ID as Ownership.**
- Exactly 30 founding institution references are eligible: **5 stud operations, 15 farms and 10 racing-stable organizations**. These are NOT evidence of a separate titled parcel, barn, building or facility capacity.
- Standing stallions and boarding broodmares appear only by explicit canonical farm organization relationship and horse ID. Never equate foaling farm, breeder, owner, trainer, barn and standing farm.
- Unapproved training centers, breaking yards, trainer-created barns, generated capacity/costs and employees remain absent.
- All existing tracks are unchanged; no track automatically generates training infrastructure. Only an explicitly authorized pilot circuit should advance to active racing gameplay.

**Personnel profiles — reuse the Horse detailed dossier pattern.**
- Horse-style biography and attribute evaluation workspace, with direct links to approved organizations and records, plus Career, Connections and History tabs.
- Only the **41 approved founding people** are in the 1999 live directory. Ratings, contracts, employment, salaries and current horse assignments remain **unassessed/not certified** until supplied by the gameplay-engine authority.
- Do not reintroduce the old 68 generated professional candidates to make a page look full.
- All person links use immutable `P-...` IDs. No ambiguous display-name joins.

## Navigation and template implementation

| User entry | Existing interface destination | Identity rule |
|---|---|---|
| Personnel → Owners → organization | Ownership dossier | `O-...` |
| Facilities → Stud Farms / Farms / Racing Stables → organization | Facility dossier | SAME `O-...` |
| Breeding → Stud Farms → organization | SAME Facility dossier | SAME `O-...` |
| World → Organizations → organization | Ownership dossier | SAME `O-...` |
| World → People → person | Personnel dossier | `P-...` |
| Linked principal, investor or strategist | Personnel dossier | Exact person ID |
| Linked living or historical horse | Existing Horse / history dossier | Exact `H-...` |
| Breeding & history relations | Existing canonical source records | Exact horse and organization IDs |

The Office uses **one existing FM renderer**: `profileDetail()` in `public/next/next.js`. The exact-ID founding source adapter in `public/next/1999-restored-profiles.js` creates only source nodes for the SAME renderer. Ownership and Facilities use its original `ng-profile-track` and `ng-track-workspace` Track chassis; personnel use its original `ng-profile-horse` and `ng-horse-dossier` Horse chassis. `FoundingProfile:ownership:O-...`, `FoundingProfile:facility:O-...`, and `FoundingProfile:person:P-...` route into this single renderer, including canonical World records. The obsolete parallel `1999-founding-profiles.js` renderer was removed; DO NOT restore it. Site-only CSS is scoped in `public/next/next.css` and must not restyle actual Track or Horse pages.

**Logo gate:** `public/assets/office/founding-organization-logo-index.json` contains the 37 permitted exact-ID slots. The 108-record legacy logo manifest is excluded from these profiles. A source-approved logo may be assigned to `organization:O-...` and automatically appear in the corresponding ownership and facility profiles; otherwise the existing initials placeholder is used. Do not silently reuse or regenerate a logo.

## Acceptance tests

- `tests/1999-founding-profiles.test.mjs`: verifies the single REAL renderer, all 37 organizations, 30 facility institution references, 41 approved people and their exact ownership IDs, 118 US/Canada/Cuba tracks, no international in the site, zero unapproved ratings/facilities.
- `scripts/1999-management-browser-smoke.sh`: headless Chromium Office navigation including World person → Horse-style personnel dossier, Personnel Owners → Track-style ownership dossier and Facilities Stud Farms → Track-style facility dossier.
- Keep existing 1999 source integration, Canon Desk and Desktop Visual Audit checks. No old save or synthetic racing population can be restored to make a browser check pass.


## Track and pilot scope lock

The existing geography authority lists **118 North American/Caribbean tracks including Oriental Park, Cuba**, of which 102 are opening-operational 1999 WTW courses and 16 are historic closures. All 118 belong in the site track directory. None of the **16 international tracks** belongs in the 1999 playable website. Historic or temporarily dormant tracks remain visible, never misrepresented as open meets. Never use the track count to generate training centers, barns, employees, or race cards.

This **clean beginning is not the finished simulation world**. The next step is to seed a controlled, separately identified starter population of eligible horses, trainers, jockeys and operative facilities using the established organizations and IDs, then validate ages, race eligibility, entries, scheduling, finances and gameplay. The gameplay-engine authority must explicitly commit that population; UI-only proposals must not silently turn into active people, horses or facilities.

## Scope of later work

The separate gameplay-engine window owns activation of the first horses and circuits, contracts, personnel ratings, finances and state. This UI consumes released exact-ID data. Do not modify this template structure or duplicate identity records without new user approval.
