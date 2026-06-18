ContractorFlow Milestone: Leads Supabase Beta Success

Date: 2026-06-18

Milestone Summary

ContractorFlow successfully validated Leads against Supabase in controlled beta mode.

This milestone confirms that the Leads entity can now operate through the ContractorFlow feature-flag rollout strategy while:

1. Keeping `USE_SUPABASE = false`
2. Preserving local-first behavior for all other non-validated entities
3. Using contractor-scoped Supabase reads and writes for Leads only
4. Maintaining authenticated, RLS-protected tenant access

This marks the third verified Supabase-backed entity after Settings and Clients.

⸻

Test Configuration

Backend Flags:

USE_AUTH = true
USE_SUPABASE_SETTINGS = true
USE_SUPABASE_CLIENTS = true
USE_SUPABASE_LEADS = true
USE_SUPABASE = false

Environment:

VITE_SUPABASE_URL configured
VITE_SUPABASE_ANON_KEY configured

Supabase Components:

* Supabase Auth active
* Contractor context restored
* Leads table available
* Leads beta RLS policy applied
* DataProvider leads routing enabled through the dedicated flag

⸻

What Was Verified

Verified:

* Login works
* Logout works
* Create lead
* Save lead to Supabase
* Refresh and reload from Supabase
* Archive lead
* Restore lead

⸻

Behavior Notes

Archive Behavior

Leads archive behavior is based on:

archived_at

not on:

status

This is intentional and acceptable for the current beta rollout.

A lead may remain with:

status = active

while still being treated as archived when:

archived_at

is populated.

This matches the current soft-delete model used by the Supabase service layer.

Logout Reliability

Reliable auth testing for Leads also required fixing the Sign Out confirmation flow so Supabase Auth sessions could be properly cleared between tests.

This was necessary to confirm that protected beta requests no longer reused the previous authenticated session after logout.

⸻

RLS Requirement

Leads did not fully work in beta mode until the Leads-specific RLS policy was added.

Required file:

supabase/rls_leads_beta.sql

This policy was necessary so authenticated users could select, insert, update, and delete Leads only when they are active members of the matching contractor.

This further validates the RLS-first backend strategy for entity-by-entity rollout.

⸻

Result

SUCCESS

Verified outcomes:

* Lead records save to Supabase
* Lead records reload after refresh
* Login and logout now support reliable beta auth testing
* Archived leads can be restored correctly
* Controlled entity-flag rollout works for Leads
* Settings and Clients continue working alongside Leads

⸻

Current Backend Position

Validated Supabase-backed entities:

* Settings
* Clients
* Leads

Still local-first:

* Projects / Jobs
* Estimates
* Contracts
* Invoices
* Payments
* Events
* Photos / Storage

Global backend mode remains off:

USE_SUPABASE = false

⸻

Next Recommended Entity

Projects / Jobs

Reason:

Projects / Jobs is the next logical rollout after Leads because it builds on validated contractor-scoped lead data and will exercise the next level of operational workflow, including active job lifecycle behavior before moving further into estimates, contracts, invoices, and payments.
