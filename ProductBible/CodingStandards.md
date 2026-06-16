# Coding Standards

- Prefer reusable components over repeated page-specific markup.
- Keep data access inside the services layer.
- Do not call Supabase directly from pages or presentational components.
- Keep [`src/App.jsx`](/Users/josuearana/Documents/contractorflow-crm/src/App.jsx) small by pushing feature logic into pages, hooks, utils, and services.
- Reuse existing modals, toast patterns, archive behavior, and shared UI before adding new abstractions.
- Add user-facing text through translation keys only.
- For normal product work, maintain local React state and mock-data compatibility unless Supabase connection is explicitly in scope.
