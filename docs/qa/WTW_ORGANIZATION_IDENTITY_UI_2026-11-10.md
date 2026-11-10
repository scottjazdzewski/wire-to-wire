# WTW — Organization identity logo slots (UI-only)

## Purpose

All player and non-player organizations should support one compact logo slot that is distinct from the profile-section shield badges. Until approved artwork is available, display a neutral initials tile. This is a presentation component; **the master organization database remains authoritative**.

## Current UI

- Decision Desk: clicking the small **Your Stable** tile and name opens **Organization Overview**.
- Organization Overview reads the active Office save (`wtwOfficeStateV30`) for stable horses, race targets, open decisions, saved follow-ups, available cash and source-backed opportunities. No parallel data store is created.
- Organization profile identities (currently Farm Profile, and the template for Stable, Sales Organization, Ownership Group, Organization and Breeding Farm profiles) reuse this logo component.
- Header: **DUE N** appears only when a saved follow-up is due or overdue. **CASH —** means a dollar balance has **not** been established; qualitative indicators like `cash_flexibility` are never treated as currency.

## Adding approved logos

Place the licensed/approved image inside the existing `public/assets/` tree. Only then add a URL pointer in `public/assets/office/organization-logo-index.json`:

```json
{
  "version": 1,
  "organizations": {
    "stable:CANONICAL_STABLE_ID": "/assets/organizations/stable-logo.webp",
    "farm:CANONICAL_FARM_ID": "/assets/organizations/farm-logo.webp"
  }
}
```

Keys are scoped by entity type and ID. The UI can temporarily accept a typed name key (e.g. `farm:Cedar Spoke`) for existing prototype views that do not expose IDs, but canonical stable identifiers must replace those bridges as the database becomes available. There is also a temporary `player` logo key for the player's operation while no canonical stable ID exists.

The index contains **only media pointers**. Never add, rename, infer, duplicate, or modify organization identities, names, histories, locales, assets, or memberships there.

Image paths must be approved local `/assets/` image files. Missing files fall back to neutral initials. Organizations without actual logos must retain their placeholder rather than be assigned a fabricated crest or a generic horse identity.

## Finance/data guardrail

The Office prototype currently has `finances.stable` decision-effect flags, but **no verified starting cash balance**. The dashboard shows `—`. When a real monetary field arrives under the existing save's financial record, the read-only cash indicator may display it; no default cash is invented.

The Office's original follow-up engine, race and horse lists, and decision system remain the sources of truth for management summary counts.

## Future extension

When canonical organization IDs and brand files are exposed across more routes, use the shared `organizationLogoMarkup` component. Do not create one bespoke graphic workflow per organization category. This retains one coherent FM/OOTP-style visual language.
