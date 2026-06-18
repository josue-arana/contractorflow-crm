# ContractorFlow Backend Strategy

Date: 2026-06-17

## Purpose

This document defines the current backend strategy for ContractorFlow CRM.

The goal is to move from local React state to Supabase safely, incrementally, and without breaking existing UI flows during active product development.

## Core Strategy

### 1. Local-First Development

ContractorFlow remains local-first by default.

That means:

- day-to-day UI development should continue to work without requiring a live backend
- local React state and mock/local services remain the default source of truth for most entities
- new UI work should not be blocked by database setup, seed data, or RLS debugging

This follows the existing architectural direction documented in:

- `docs/adr/ADR-002-local-state-before-supabase.md`
- `docs/adr/ADR-004-services-layer-before-backend.md`

### 2. Feature-Flag Rollout

Supabase is rolled out behind feature flags instead of through a single full-app cutover.

This reduces risk by allowing one entity at a time to move to real persistence while the rest of the app continues to run in local mode.

Current rollout principle:

- local mode is the safe default
- Supabase is enabled only where the entity has been validated end to end
- UI pages should continue to call the services/data provider layer rather than calling Supabase directly

### 3. `USE_SUPABASE` Remains `false` Until Each Entity Is Validated

The global backend switch must remain off until the application has enough validated entity coverage to justify a broader backend mode.

Current intended behavior:

- `USE_SUPABASE = false`
- validated entities may still be enabled individually
- unvalidated entities must continue using local services

This prevents partially ready services from changing app-wide behavior before the related UI flows, data mappings, and RLS policies are proven.

## Flag Model

### 4. Entity-Specific Flags

ContractorFlow should use entity-specific enablement flags for incremental migration.

Current and planned examples:

- `USE_SUPABASE_SETTINGS`
- future `USE_SUPABASE_CLIENTS`
- future `USE_SUPABASE_LEADS`
- future `USE_SUPABASE_PROJECTS`
- future `USE_SUPABASE_ESTIMATES`
- future `USE_SUPABASE_CONTRACTS`
- future `USE_SUPABASE_INVOICES`
- future `USE_SUPABASE_PAYMENTS`
- future `USE_SUPABASE_EVENTS`
- future storage-specific flags if needed for photos/files

Expected rule:

- each entity flag controls only that entity
- entity flags are enabled only after that entity passes migration validation
- the data provider remains the single routing layer that decides whether an entity uses local or Supabase services

This keeps the migration surface small and reversible.

## Security and Tenancy

### 5. RLS-First Security Model

Supabase integrations must be designed with Row Level Security first, not added later as cleanup work.

That means:

- tables should assume authenticated access
- policies should be written before rollout, then validated with real user sessions
- service methods should require contractor context for reads and writes
- integrations should be considered incomplete if they work only with elevated/manual database access

RLS is not optional hardening. It is part of the acceptance criteria for a real backend entity.

### 6. Contractor-Scoped Multi-Tenancy

ContractorFlow is a multi-tenant SaaS and every business entity must be scoped to a contractor.

Required model:

- each tenant-visible row belongs to a contractor
- reads must only return rows for the authenticated contractor
- writes must only affect rows for the authenticated contractor
- archive, restore, and delete operations must preserve tenant isolation the same way list/create/update do

The app should not rely on client-side filtering for tenant protection. Tenant isolation must be enforced by schema design, service behavior, and RLS policies together.

## Why Settings Went First

### 7. Why Settings Was Chosen as the First Entity

Settings was chosen first because it is the lowest-risk backend migration target in the product.

Reasons:

- it is a single-entity flow with limited relational complexity
- it has a clear read/update lifecycle
- it is easy to verify persistence with a refresh test
- it validates the full backend chain: auth, contractor context, RLS, service routing, and write persistence
- it creates confidence in the Supabase foundation without risking higher-volume operational flows like leads, projects, invoices, or payments

The successful Settings milestone proved that ContractorFlow can:

- authenticate with Supabase Auth
- enforce contractor-aware access through RLS
- load real tenant data into the React app
- save changes through the UI
- persist state across refreshes

## Migration Approach

### 8. How Future Entities Should Be Migrated

Each future entity should follow the same incremental migration path.

Recommended sequence:

1. Confirm the UI already routes through `services/` and `dataProvider`.
2. Define or review the Supabase table schema, including contractor ownership and archive behavior.
3. Add or validate contractor-scoped RLS policies.
4. Build or refine the entity’s Supabase service module.
5. Keep the entity disabled behind its own feature flag.
6. Validate field mappings between UI shape and database shape.
7. Test all core CRUD flows, including archive/restore/delete behavior where applicable.
8. Test refresh persistence and authenticated-session behavior.
9. Enable only that entity’s flag in development or limited testing.
10. Keep the global `USE_SUPABASE` flag off until enough entities are proven.

Migration guardrails:

- do not bypass the services layer
- do not migrate multiple high-risk entities at once
- do not enable an entity just because the table exists
- do not treat “read works” as sufficient; full write and lifecycle behavior must be validated

## Rollback

### 9. Rollback Strategy If a Supabase Integration Fails

Rollback must be fast, simple, and low-risk.

Primary rollback method:

- turn the affected entity flag back off
- return that entity to its local service path through `dataProvider`

If an integration fails during testing or rollout:

1. Disable the entity-specific Supabase flag immediately.
2. Confirm the app falls back to local behavior for that entity.
3. Document the failure mode, including whether it was schema, mapping, auth, RLS, or UI-state related.
4. Fix the issue behind the flag without changing the broader rollout state.
5. Re-run the entity validation checklist before re-enabling it.

Why this works:

- the app is intentionally local-first
- entity flags isolate blast radius
- the services/data provider layer prevents backend implementation details from leaking throughout the UI

If a failure affects authentication, tenant isolation, or RLS correctness, the integration should be considered blocked until those issues are resolved, even if basic CRUD appears to work.

## Definition of Done

### 10. Definition of Done for an Entity Migration

An entity migration is done only when all of the following are true:

- the entity still works in the existing UI without regressions
- reads and writes are routed through the service layer and `dataProvider`
- the entity has a dedicated feature flag
- contractor-scoped schema requirements are in place
- RLS policies are implemented and validated with authenticated sessions
- create, read, update, archive, restore, and delete flows match current product behavior as applicable
- field mappings between UI shape and database shape are verified
- refresh persistence is confirmed
- failure handling is understood and the entity can be rolled back by disabling its flag
- local mode remains intact for all entities that have not yet migrated
- the migration has been documented with known risks, constraints, and test results

An entity is not done if:

- it only works with manual database intervention
- it depends on bypassing RLS
- it lacks contractor isolation guarantees
- it changes user-visible behavior unexpectedly
- it requires enabling `USE_SUPABASE` globally before the rest of the app is ready

## Current Position

As of 2026-06-17:

- ContractorFlow remains local-first overall
- `USE_SUPABASE` should remain `false`
- Settings is the first validated Supabase-backed entity
- future entities should be migrated one at a time behind their own flags
- RLS and contractor isolation remain mandatory for every real-data rollout

This strategy preserves shipping velocity while building toward a production-ready multi-tenant backend safely.
