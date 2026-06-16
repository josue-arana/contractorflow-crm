# ADR-004: Services Layer Before Backend

Status: Accepted

Context
- Backend implementations (Supabase or others) may change over time.
- Direct calls to the backend from UI components lead to fragile, hard-to-update UI code.

Decision
- UI pages call local service functions (in `services/`) rather than calling Supabase directly. Services abstract backend details and adapt to API changes.

Consequences
- UI is insulated from backend changes; migrations require updating services only.
- Slight abstraction cost up front, improved long-term maintainability.
