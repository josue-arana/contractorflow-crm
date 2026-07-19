Aymero Milestone: Clients Supabase Beta Success

Date: 2026-06-18

Milestone Summary

Aymero successfully validated Clients against Supabase in controlled beta mode.

This milestone confirms that the Clients entity can now operate through the Aymero feature-flag rollout strategy while:

1. Keeping `USE_SUPABASE = false`
2. Preserving local-first behavior for all other non-validated entities
3. Using contractor-scoped Supabase reads and writes for Clients only
4. Maintaining authenticated, RLS-protected tenant access

This marks the second verified Supabase-backed entity after Settings.

⸻

Test Configuration

Backend Flags:

USE_AUTH = true
USE_SUPABASE_SETTINGS = true
USE_SUPABASE_CLIENTS = true
USE_SUPABASE = false

Environment:

VITE_SUPABASE_URL configured
VITE_SUPABASE_ANON_KEY configured

Supabase Components:

* Supabase Auth active
* Contractor context restored
* Clients table available
* Clients beta RLS policy applied
* DataProvider clients routing enabled through the dedicated flag

⸻

What Was Verified

Verified:

* Create client
* Save client to Supabase
* Refresh and reload from Supabase
* Archive client
* Show archived client in UI
* Restore client
* Delete permanently: not yet tested

⸻

Behavior Notes

Archive Behavior

Clients archive behavior is based on:

archived_at

not on:

status

This is intentional and acceptable for the current beta rollout.

A client may remain with:

status = active

while still being treated as archived in the UI when:

archived_at

is populated.

This matches the current soft-delete model used by the Supabase service layer.

⸻

RLS Requirement

Clients did not fully work in beta mode until the Clients-specific RLS policy was added.

Required file:

supabase/rls_clients_beta.sql

This policy was necessary so authenticated users could select, insert, update, and delete Clients only when they are active members of the matching contractor.

This validates the RLS-first backend strategy for entity-by-entity rollout.

⸻

Result

SUCCESS

Verified outcomes:

* Client records save to Supabase
* Client records reload after refresh
* Supabase field mapping now matches the existing UI shape
* Archived clients appear in Archived view
* Restore returns clients to Active view
* Controlled entity-flag rollout works for Clients
* Settings continues working alongside Clients

⸻

Current Backend Position

Validated Supabase-backed entities:

* Settings
* Clients

Still local-first:

* Leads
* Projects
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

Leads

Reason:

Leads is the next logical rollout after Clients because it directly depends on contractor-scoped business data, is already planned in the migration order, and will further validate list/create/update/archive flows before moving into more relational entities like Projects, Estimates, and Invoices.
