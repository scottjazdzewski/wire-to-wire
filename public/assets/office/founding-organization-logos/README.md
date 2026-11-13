# Wire to Wire — Founding ownership image drop

This directory receives user-approved individual ownership-group / facility artwork only.
Do not copy the 108 legacy owner images, regenerate placeholders, crop logo edges or
change any organization name/identity.

**For each approved logo uploaded:**

1. Name the asset with the **existing immutable organization ID**:
   `O-000014.webp` for `O-000014`, etc.
2. Retain a source/master version separately where appropriate. Facility photographic
   masters use 1600×1200 (4:3); ownership crests/logos retain their supplied
   proportions and transparent background if provided. Export WebP or PNG
   without distortion.
3. Register exactly one key in
   `public/assets/office/founding-organization-logo-index.json`:
   `"organization:O-000014": "/assets/office/founding-organization-logos/O-000014.webp"`
   Only use existing IDs in `approvedOrganizationIds`. Never map by a name alias.
4. Verify the SAME image appears on the Ownership page, Facility page (where
   applicable), and next to every horse whose **owner ID is O-000014**. Foaling farm,
   trainer, breeder and barn associations must NEVER imply ownership.

**Profile display sizes:** Standard Track-style organization logo plate 214×108
(display contained, never cropped); Horse and Person images use separate 4:5
portrait presentation frames (approved masters 1600×2000). Missing images
show a neutral placeholder. These are static UI assets, not playable-world
entity definitions.
