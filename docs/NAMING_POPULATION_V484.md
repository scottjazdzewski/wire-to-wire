# WIRE TO WIRE — Naming Engine V484 (Private AI + Population Jobs)

## What this release does

* Enables **authenticated, on-demand** name generation in Stable → Naming Desk when Cloudflare Pages has a working `AI` binding. The explicit `NAMING_AI_PREVIEW_ENABLED=false` kill switch turns it off. It never registers a horse.
* Adds a private, resumable **asynchronous population naming** service using Cloudflare's `@cf/meta/llama-3.3-70b-instruct-fp8-fast` Batch API. A job contains **1–16 verified game-supplied foal briefs**, not an entire year. Maximum job payload 180 KB; source event, owner, breeder and origin required.
* Provides pure gameplay APIs for creating a foaling-event name brief, chunking a 55,000-foal year, and screening candidate names. These only emit proposals for future editorial/owner authorization.
* Stores only bounded batch checkpoints and daily AI usage counters in the EXISTING WTW D1 database. No new database, no Cloudflare account credentials, no changes to historical tables or 1999 career saves. Source/game browser modules remain mirrored.

## Scale contract (not a completed 2099 population)

55,000 foals/year ÷ 16 briefs/job → **3,438 jobs per year**. Each job queues individual AI prompts and returns up to two distinct ideas per foal. Jobs can be resumed/polled by the same stable `jobId` without a second charge. Missing/empty stories are rejected; a name with a collision, an old owner rating, or missing source evidence is held. Nothing is automatically added to world horses or to the registry.

The default maximum is **256 individual model inference requests per UTC day**, which is above 55,000 per calendar year in theoretical yearly capacity. Game time may advance faster than real time, so bulk backfills need an explicitly monitored higher quota; do not launch a multi-million-horse generation unreviewed. Usage can incur Cloudflare Workers AI charges; Cloudflare's published pricing and rate limits apply.

## Cloudflare account activation (not performed by a GitHub code merge)

1. Confirm the **existing** WTW Cloudflare Pages/Worker deployment and Access policy are the ones running this repo's `main`. Do not create a second site or D1 instance.
2. Confirm the existing deployment's Workers AI binding is named exactly `AI`. The repo's Wrangler config declares it, but Cloudflare Pages GitHub deployments may require adding the binding in the Cloudflare dashboard.
3. Apply `migrations/0007_population_naming_jobs.sql` to the **existing WTW-only D1** with `npx wrangler d1 migrations apply wtw-canon-desk-db --remote` after verifying the correct Cloudflare account and database. Do not run the command against another project.
4. For production, Cloudflare environment variables can set `NAMING_AI_PREVIEW_ENABLED=true` and `NAMING_AI_POPULATION_ENABLED=true`; code defaults to enabled only when authorized and bindings exist. Kill switches: set either variable to literal `false`.
5. Set `NAMING_AI_POPULATION_DAILY_CAP` to an approved numeric value, default **128** if omitted. The repository Wrangler config uses **256**. Before scaling up, inspect billing, editor acceptance, and batch throughput. If the Worker is deployed as Pages rather than Wrangler Worker, mirror the `vars` from `wrangler.jsonc` in the actual Cloudflare environment.
6. Verify one authenticated tiny naming preview and one asynchronous 1-foal job, poll it, and inspect the output. No horse should appear in the Stable/World rosters. Real AI quality and 90% acceptance are still UNPROVEN.

## Private endpoints (all behind existing Cloudflare Access)

* `GET /api/naming/status` — **zero-AI-cost**, Access-protected live readiness diagnostic: AI binding, preview enablement, D1 migration and population daily quota. Check this before paid inference.
* `POST /api/naming/preview` — generate up to eight preview candidates for one test-only origin; output not approved.
* `POST /api/naming/population/submit` — JSON `{schema:'WTW_POPULATION_NAMING_BATCH_V1', jobId, year, items:[{brief}], recentNames:[]}`; returns a durable job checkpoint and Cloudflare request ID. Exact `jobId`+payload idempotency prevents duplicate charges.
* `GET /api/naming/population/job?jobId=...` — read-only checkpoint and proposals when ready.
* `POST /api/naming/population/poll` — JSON `{jobId}`; polls Cloudflare queue. Returns 202 pending or 200 ready, never commits a name.

### Safety: source integrity and editorial truth

This is **candidate generation**, not official Jockey Club name availability, certified pedigree, automatic player-owner approval, AI-owned-farm governance, or a bulk horse importer. Real foaling events and identities must exist in the game first. Client/game must independently recheck the resulting name against the current canonical world, registered horses and reserved cohorts before applying existing registration gates. The production generator must keep player and AI-owner approval policies separate; no service response may bypass the existing registrar.