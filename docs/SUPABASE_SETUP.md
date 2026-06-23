Project Name: contractorflow-beta
Region: East US (N. Virginia)
Date Created: 6/16/2026
Project URL: https://qespkkmxaxzsfqrlghev.supabase.co

## Auth Redirect Setup

ContractorFlow now resolves company data from the authenticated user's `contractor_members` row. New confirmed users who do not have a membership yet can complete beta onboarding inside the app, which creates their `contractors`, `contractor_members`, and `company_settings` records automatically.

### Supabase Dashboard

Set these values in `Authentication -> URL Configuration`:

- `Site URL`
  - Local: `http://localhost:5174`
  - Production: `https://YOUR-NETLIFY-SITE.netlify.app`
- `Redirect URLs`
  - `http://localhost:5174/*`
  - `https://YOUR-NETLIFY-SITE.netlify.app/*`

### App Redirect Behavior

- Signup confirmation and password recovery now send `redirect_to` using the current app origin at runtime.
- Optional override: set `VITE_AUTH_REDIRECT_URL` if a deployment needs an explicit auth callback base instead of `window.location.origin`.
- Local default fallback remains `http://localhost:5174`.

### Private Beta Onboarding Choice

This app now uses app-driven onboarding for new confirmed users:

- Signup creates the auth account.
- After the first confirmed login, users without an active `contractor_members` row are guided through creating their contractor profile in-app.
- The onboarding flow creates `contractors`, `contractor_members`, and `company_settings`.
- Existing manually linked users continue to resolve directly into their contractor data with no onboarding prompt.
