# CRUD Migration Plan (Local -> Supabase)

Purpose: a concise mapping of local/mock data to future Supabase tables and services. Keep this document small and actionable for future migration work and Codex prompts.

Private beta goal
- Target: migrate to a state where 1–3 contractors can use Aymero with isolated, real data in Supabase (private beta).

Recommended migration order
1. company settings
2. clients
3. leads
4. projects/jobs
5. estimates
6. contracts
7. invoices
8. payments
9. events
10. photos/storage

Entity mapping

- clients
  - Current local/mock data source: `src/data/mockLeads.js` (clients referenced in mock data) and local React state managed by services.
  - Future Supabase table: `clients`
  - Existing service file: `src/services/clientsService.js`
  - Required operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: `src/pages/ClientsPage.jsx`, `src/pages/ClientProfilePage.jsx`, client forms in `components/clients/ClientFormModal.jsx`
  - Notes/risks: canonical contact deduplication, address normalization, company -> client relationships.

- leads
  - Current local/mock data source: `src/data/mockLeads.js` + local state via `leadsService`
  - Future Supabase table: `leads`
  - Existing service file: `src/services/leadsService.js`
  - Required operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: `src/pages/LeadsPage.jsx`, pipeline components in `src/components/pipeline/*`
  - Notes/risks: stage/status mapping and owner assignment, migrating in-progress pipeline state without disrupting active work.

- projects/jobs
  - Current local/mock data source: local project state and `src/data` mocks
  - Future Supabase table: `projects` (or `jobs`)
  - Existing service file: `src/services/projectsService.js`
  - Required operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: `src/pages/JobsPage.jsx`, `src/pages/ProjectDetailPage.jsx`, project cards and workspace components
  - Notes/risks: complex relations to estimates/contracts/invoices; migrate child records consistently.

- estimates
  - Current local/mock data source: local state + `src/data` mocks
  - Future Supabase table: `estimates`
  - Existing service file: `src/services/estimatesService.js`
  - Required operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: `src/pages/EstimatesPage.jsx`, `src/pages/EstimateBuilderPage.jsx`
  - Notes/risks: line items and total calculation, mapping draft vs final states.

- contracts
  - Current local/mock data source: local contract state
  - Future Supabase table: `contracts`
  - Existing service file: `src/services/contractsService.js`
  - Required operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: `src/pages/ContractsPage.jsx`
  - Notes/risks: signatures and PDF generation, linking to estimates/projects.

- invoices
  - Current local/mock data source: `src/data/mockInvoices.js` and local state
  - Future Supabase table: `invoices`
  - Existing service file: `src/services/invoicesService.js`
  - Required operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: `src/pages/InvoicesPage.jsx`, `src/pages/InvoiceDetailPage.jsx`
  - Notes/risks: payment status reconciliation, historical balances, external payment gateways.

- payments
  - Current local/mock data source: local state and services
  - Future Supabase table: `payments`
  - Existing service file: `src/services/paymentsService.js`
  - Required operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: `src/pages/PaymentsPage.jsx`, payment modals `components/common/RecordPaymentModal.jsx`
  - Notes/risks: payment provider tokens should not be stored in plain DB; use secure gateways.

- events
  - Current local/mock data source: `src/data/mockScheduleEvents.js` + local state
  - Future Supabase table: `events` (or `schedule_events`)
  - Existing service file: `src/services/eventsService.js`
  - Required operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: `src/pages/CalendarPage.jsx`, `src/components/calendar/ScheduleEventModal.jsx`
  - Notes/risks: timezone handling, recurring events.

- photos
  - Current local/mock data source: local uploads and `src/services/photosService.js` (mock)
  - Future Supabase table: media metadata table (e.g., `photos`) + Supabase Storage bucket for blobs
  - Existing service file: `src/services/photosService.js`, upload modal `components/common/PhotoUploadModal.jsx`
  - Required operations: `list`, `getById`, `create` (upload + metadata), `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: project photo gallery, upload modal, portal photo views
  - Notes/risks: storage costs, privacy, presigned URLs vs anon access, cleanup of orphaned files.

- company settings
  - Current local/mock data source: `src/services/settingsService.js` and `src/pages/SettingsPage.jsx`
  - Future Supabase table: `company_settings` (or `companies` with nested settings)
  - Existing service file: `src/services/settingsService.js`
  - Required operations: `list` (or get single), `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
  - UI pages/components: `src/pages/SettingsPage.jsx`
  - Notes/risks: multi-tenant separation, secrets (API keys) should live in secure config and not in plain DB.

Migration notes and risks
- Soft-delete vs hard-delete: mirror local archive/restore behavior; implement `archived_at` or boolean `archived` columns.
- Referential integrity: create foreign keys and backfill IDs carefully; prefer UUIDs for stable cross-entity references.
- RLS & Auth: draft RLS policies early (private beta requires isolation) but enable them last to avoid developer friction.
- Storage: use Supabase Storage for photos; store metadata in `photos` table with `storage_path` field.
- Backups & rollbacks: snapshot data before each migration step; test migration with small datasets first.
- Performance: paginate `list` endpoints; add indexes for common filters (company_id, status, created_at).

Checklist for a minimal private beta
- Create isolated Supabase project per contractor or use `company_id` + RLS to isolate data.
- Migrate `company settings` -> confirm app reads settings from Supabase.
- Migrate `clients` and `leads` and validate UI flows (create/update/list) against Supabase.

This document is intentionally concise — keep it updated as services and table schemas evolve.
