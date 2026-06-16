# Private Beta Launch Checklist

Goal
- Get 1–3 contractors using ContractorFlow with isolated, real data to validate workflows and readiness for paid plans.

Must Have Before Inviting Contractors
- Supabase Auth enabled (or equivalent secure auth).
- Real CRUD connected for: company settings, clients, leads, projects/jobs, estimates, contracts, invoices, payments, events.
- Basic company data isolation (per-company or RLS-based isolation).
- Archive/restore (soft-delete/restore) working as in app.
- Bilingual UI (English/Spanish) functioning.
- Mobile layout usable for common tasks.
- Settings / company profile editable and persisted.
- Photo upload/storage working, or clearly disabled with guidance.
- No dead buttons or broken flows on main pages.
- Build passes and a working production/dev deploy process.

Nice to Have Later
- Payment gateway integration (Stripe) for paid upgrade.
- Automated email notifications and real SMS support.
- Background job processing for large imports/exports.
- More robust role-based permissions for teams.

Free Beta Limits
- Users: 1–3 contractors (per private beta cohort).
- Duration: 15–30 day trial / beta window.
- Storage: capped (define MB/GB per contractor), purge policy described to users.
- Onboarding: manual by founder (guided setup, data import help).
- Billing: no Stripe required for beta; manual invoicing or billing later.

Manual Onboarding Plan
1. Create contractor account and company settings.
2. Seed company with a few clients, one active lead, and one active job/estimate.
3. Verify email/login and basic flows (create lead, send estimate, record payment, upload photo).
4. Walk contractor through Settings and mobile layout.
5. Capture feedback and key screenshots; keep a migration log.

Contractor Feedback Questions
- Was it easy to create a lead? If not, what was confusing?
- Was it easy to create and send an estimate? Any missing pieces?
- Did the Spanish wording feel natural and clear?
- Were there any dead or unexpected buttons/flows?
- How was the mobile experience for your core tasks?
- What features would make this worth paying for?

Go / No-Go Checklist (founder)
- Auth and login stable for invited users.
- CRUD operations working reliably for core entities.
- Company isolation validated (different contractor data cannot be seen).
- Key pages tested on mobile and desktop.
- No critical bugs blocking create/update flows.
- Feedback loop in place to collect and triage responses.

Notes
- Keep the beta small, iterate quickly, and avoid exposing production credentials or broad access.
- This checklist intentionally keeps the scope limited to a private, founder-led beta.
