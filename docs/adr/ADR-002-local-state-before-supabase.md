# ADR-002: Local State Before Supabase

Status: Accepted

Context
- Early-stage MVP needs fast UX validation without backend dependencies.
- Many UI iterations are expected before stable backend contracts exist.

Decision
- Build with local React state and mock services first; integrate Supabase/backend only after UX is validated.

Consequences
- Faster iteration and lower initial infra costs.
- Temporary duplication when mapping to real backend later.
- Backend integration is planned but decoupled from early UI work.
