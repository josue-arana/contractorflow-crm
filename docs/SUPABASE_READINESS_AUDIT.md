# Supabase Readiness Audit

This audit reviews the current Supabase service layer before `USE_SUPABASE` is enabled.

Current state:

- `USE_SUPABASE` remains `false`
- Core entity services exist for `settings`, `clients`, `leads`, `projects`, `estimates`, `contracts`, `invoices`, `payments`, and `events`
- In local mode, the app should continue using local services only and should not attempt real database calls

Overall go/no-go view:

- Lowest-risk first enablement target: `Settings`
- Most entity services are structurally ready
- Some services still depend on UI-to-database serialization or collapsed status/type mappings and should be reviewed before broad rollout

## Cross-Service Readiness Notes

- All audited Supabase services gate their behavior behind `USE_SUPABASE`
- When `USE_SUPABASE=false`, each service returns a skipped response and should not perform database work
- All business entity services require `contractorId` and return an error result if it is missing
- In development mode, missing `contractorId` triggers `console.warn(...)`
- Archive-ready entities use `archived_at` for soft delete behavior and `restore()` clears it

## Service Audit

### Settings

- File path: `src/services/supabase/settingsSupabaseService.js`
- Supabase table: `company_settings`
- Supported operations: `getSettings(contractorId)`, `updateSettings(contractorId, settings)`
- Required contractorId behavior: required for read/write operations; missing value returns an error result and logs a development warning
- Archive/restore behavior: none in service API; table includes `archived_at` but the service manages a single active settings row per contractor
- Known UI-to-database field mappings:
  - `company.name -> company_name`
  - `company.ownerName -> owner_name`
  - `company.address -> business_address`
  - `company.licenseNumber -> license_number`
  - `company.logo -> logo_file_path`
  - `defaults.paymentTerms -> default_payment_terms`
  - `defaults.depositPercentage -> default_deposit_percentage`
  - `defaults.invoiceDueDays -> default_invoice_due_days`
  - `defaults.materialsIncluded -> default_materials_included`
  - `app.language -> contractor_app_language`
  - `portal.language -> customer_portal_language`
  - `portal.showPayments -> show_payments_in_portal`
  - `portal.showPhotos -> show_photos_in_portal`
  - `portal.showDocuments -> show_documents_in_portal`
- Schema mismatch risks:
  - Service shape is different from CRUD entity services, so consumers must continue using the existing `dataProvider.settings` wrapper
  - Readiness depends on one row per contractor and successful default-row creation when no record exists
- Beta readiness status: `Ready`

### Clients

- File path: `src/services/supabase/clientsSupabaseService.js`
- Supabase table: `clients`
- Supported operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
- Required contractorId behavior: required on all operations; missing value returns an error result and logs a development warning
- Archive/restore behavior: `archive()` sets `archived_at` to the current timestamp; `restore()` clears `archived_at`
- Known UI-to-database field mappings:
  - UI display name is split across `first_name`, `last_name`, and `display_name`
  - Contact fields map directly to `phone`, `email`, `notes`, `preferred_language`, `status`
  - Address data maps to `address`, `city`, `state`, `postal_code`
- Schema mismatch risks:
  - UI often treats address as a single field, while the table stores both combined and segmented address fields
  - Round-tripping may preserve less structured address data unless the UI later supports separate city/state/postal editing consistently
- Beta readiness status: `Ready`

### Leads

- File path: `src/services/supabase/leadsSupabaseService.js`
- Supabase table: `leads`
- Supported operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
- Required contractorId behavior: required on all operations; missing value returns an error result and logs a development warning
- Archive/restore behavior: `archive()` sets `archived_at`; `restore()` clears it
- Known UI-to-database field mappings:
  - `client -> name`
  - `projectType` or `projectTitle -> service_type`
  - `value -> estimated_value`
  - `notes` and `nextStep` collapse into `notes`
  - `clientId -> client_id`
  - `projectId -> project_id`
  - UI statuses map to enum values such as `New Lead -> new`, `Estimate Sent -> estimate_sent`, `Won -> won`
  - UI priorities map to stored values such as `Medium -> normal`
- Schema mismatch risks:
  - Lead UI fields are broader than the table; some context is compressed into shared text fields
  - `projectStatus` is inferred from lead status instead of being stored directly
- Beta readiness status: `Ready`

### Projects

- File path: `src/services/supabase/projectsSupabaseService.js`
- Supabase table: `projects`
- Supported operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
- Required contractorId behavior: required on all operations; missing value returns an error result and logs a development warning
- Archive/restore behavior: `archive()` sets `archived_at`; `restore()` clears it
- Known UI-to-database field mappings:
  - `projectTitle`, `title`, or `projectType -> title`
  - `projectType -> project_type`
  - `address` or `location -> address`
  - `estimatedValue -> estimated_value`
  - `contractValue -> contract_value`
  - `startDate -> start_date`
  - `targetCompletion -> target_end_date`
  - `notes` and `nextStep` collapse into `notes`
  - `clientId -> client_id`
  - `leadId -> lead_id`
  - Several UI statuses collapse into schema enum values, especially multiple in-progress style states mapping to `in_progress`
- Schema mismatch risks:
  - Distinct UI states such as `Waiting on Client`, `Waiting on Materials`, and `Ready for Final Walkthrough` do not have dedicated database states
  - Service currently does not hydrate related client display data, so consumer assumptions about `client`, `phone`, or `email` should be verified before enablement
- Beta readiness status: `Needs Review`

### Estimates

- File path: `src/services/supabase/estimatesSupabaseService.js`
- Supabase table: `estimates`
- Supported operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
- Required contractorId behavior: required on all operations; missing value returns an error result and logs a development warning
- Archive/restore behavior: `archive()` sets `archived_at`; `restore()` clears it
- Known UI-to-database field mappings:
  - `number` or `estimateNumber -> estimate_number`
  - `title`, `projectTitle`, or `estimateTitle -> title`
  - `summary` or `scopeOfWork -> scope_of_work`
  - `lineItems -> line_items`
  - `subtotal -> subtotal`
  - `discountAmount -> discount_amount`
  - `taxAmount -> tax_amount`
  - `total` or `amount -> total_amount`
  - `depositPercentage -> deposit_percentage`
  - `materialsIncluded -> materials_included`
  - `paymentTerms -> payment_terms`
  - `clientId -> client_id`
  - `projectId -> project_id`
- Schema mismatch risks:
  - Line items are normalized into a compact stored structure, so line item field naming should be verified anywhere the UI expects richer objects
  - Related client/project display fields are not hydrated from joins
- Beta readiness status: `Ready`

### Contracts

- File path: `src/services/supabase/contractsSupabaseService.js`
- Supabase table: `contracts`
- Supported operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
- Required contractorId behavior: required on all operations; missing value returns an error result and logs a development warning
- Archive/restore behavior: `archive()` sets `archived_at`; `restore()` clears it
- Known UI-to-database field mappings:
  - `number` or `contractNumber -> contract_number`
  - `title` or `projectTitle -> title`
  - `scope` or `scopeOfWork -> scope_of_work`
  - `paymentTerms -> payment_terms`
  - `total` and related total aliases -> `total_amount`
  - `depositAmount` or `depositRequired -> deposit_amount`
  - `clientId -> client_id`
  - `projectId -> project_id`
  - `estimateId -> estimate_id`
  - Extra UI sections such as timeline, materials, change orders, responsibilities, warranty, and other terms are serialized into `terms`
  - Signed/sent state is derived through `status`, `sent_at`, `signed_at`, and `signed_by`
- Schema mismatch risks:
  - The table does not have first-class columns for several contract UI sections, so the service relies on structured content stored in `terms`
  - Estimate-to-contract conversion flows should be tested carefully to confirm status/signature/totals round-trip cleanly
- Beta readiness status: `Needs Review`

### Invoices

- File path: `src/services/supabase/invoicesSupabaseService.js`
- Supabase table: `invoices`
- Supported operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
- Required contractorId behavior: required on all operations; missing value returns an error result and logs a development warning
- Archive/restore behavior: `archive()` sets `archived_at`; `restore()` clears it
- Known UI-to-database field mappings:
  - `number` or `invoiceNumber -> invoice_number`
  - `title` or `projectTitle -> title`
  - `lineItems -> line_items`
  - `subtotal -> subtotal`
  - `taxAmount -> tax_amount`
  - `total` or `amount -> total_amount`
  - `amountPaid -> amount_paid`
  - `issueDate -> issue_date`
  - `dueDate -> due_date`
  - `clientId -> client_id`
  - `projectId -> project_id`
  - `contractId -> contract_id`
  - UI-only fields such as `notes`, `paymentTerms`, `paymentHistory`, and display date helpers are serialized into `description`
- Schema mismatch risks:
  - `description` is used as a structured JSON container as well as a text field
  - Payment history is embedded on the invoice shape even though payments also exist as a separate entity
  - Display-date helpers can drift from canonical `issue_date` and `due_date` if not tested carefully
- Beta readiness status: `Needs Review`

### Payments

- File path: `src/services/supabase/paymentsSupabaseService.js`
- Supabase table: `payments`
- Supported operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
- Required contractorId behavior: required on all operations; missing value returns an error result and logs a development warning
- Archive/restore behavior: `archive()` sets `archived_at`; `restore()` clears it
- Known UI-to-database field mappings:
  - `amount -> amount`
  - `paymentDate`, `payment_date`, or display `date -> payment_date`
  - `method` or `paymentMethod -> method`
  - `referenceNumber -> reference_number`
  - `clientId -> client_id`
  - `projectId -> project_id`
  - `invoiceId -> invoice_id`
  - UI statuses map to stored values such as `Recorded -> recorded`
  - Extra UI fields such as `paymentType`, `leadId`, and display date helpers are serialized into `notes`
- Schema mismatch risks:
  - `notes` is being used as both free text and a structured JSON container
  - `paymentType` and `leadId` are not first-class schema columns, so downstream reporting/search should be validated before enablement
- Beta readiness status: `Needs Review`

### Events

- File path: `src/services/supabase/eventsSupabaseService.js`
- Supabase table: `events`
- Supported operations: `list`, `getById`, `create`, `update`, `archive`, `restore`, `deletePermanently`
- Required contractorId behavior: required on all operations; missing value returns an error result and logs a development warning
- Archive/restore behavior: `archive()` sets `archived_at`; `restore()` clears it
- Known UI-to-database field mappings:
  - `title -> title`
  - `description -> description`
  - `date` plus `startTime` and `endTime -> starts_at` and `ends_at`
  - `location` or `address -> location`
  - `notes -> notes`
  - `clientId -> client_id`
  - `projectId -> project_id`
  - UI event types map to database enum values such as `Site Visit -> appointment`, `Project Start -> job`, `Final Walkthrough -> follow_up`
  - UI statuses map to stored values such as `Pending -> scheduled`, `Complete -> completed`, `No Show -> no_show`
  - Extra UI fields such as `reminder`, `leadId`, `clientName`, `projectTitle`, display date, and presentation-specific labels are serialized into `description`
- Schema mismatch risks:
  - Several UI event concepts are not first-class schema columns and depend on structured serialization inside `description`
  - Some UI event types collapse into a generic database value such as `Material Delivery -> other`
  - `Pending` is preserved as a UI label but stored as `scheduled`
- Beta readiness status: `Needs Review`

## Recommended First Enablement Order

1. Settings
2. Clients
3. Leads
4. Projects
5. Estimates
6. Contracts
7. Invoices
8. Payments
9. Events
10. Photos/Storage later

## Do Not Enable Yet If

- `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing
- RLS policies are not configured and tested for contractor-scoped access
- `contractorId` is not consistently available in the app layer
- Any service returns inconsistent result shapes compared with what the current UI expects
- The build is failing
- Developer Health is showing backend warnings

## Next Recommended Step

Enable and test `Settings` only before any other entity.

Reason:

- It has the narrowest surface area
- It already supports auto-creation of a default contractor row
- It is the safest place to validate environment variables, RLS behavior, `contractorId` flow, and real Supabase connectivity before moving into relational business data
