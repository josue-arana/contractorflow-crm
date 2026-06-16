# ADR-001: Archive Before Delete

Status: Accepted

Context
- Accidental or premature deletion of contractor data is high-risk for small businesses.
- Users need an easy way to recover important records (clients, invoices, projects).

Decision
- Records are archived before permanent deletion. The UI shows an "Archive" action and a separate "Permanently Delete" flow (admin or scheduled purge).

Consequences
- Safer data handling and reduced accidental data loss.
- Slightly increased storage and added UI/UX for restore and purge.
- Clear retention policy and purge tooling required.
