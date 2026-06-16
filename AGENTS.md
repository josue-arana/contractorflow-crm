# AGENTS.md

ContractorFlow CRM agent rules:

- Preserve existing functionality. Do not break flows while polishing UI or refactoring.
- Keep [`src/App.jsx`](/Users/josuearana/Documents/contractorflow-crm/src/App.jsx) lightweight. Move page-specific UI and logic into pages, components, hooks, utils, or services.
- Follow the current folder structure: `pages`, `components`, `services`, `hooks`, `translations`, `contexts`, `utils`, `lib`, `config`, and `data`.
- Use translation keys for all visible text. Do not hardcode user-facing strings in components or pages.
- Keep ContractorFlow bilingual in English and Spanish. Update both translation files together.
- Keep the app mobile-first. Check layouts, spacing, and actions on small screens.
- Never leave visible dead buttons, links, toggles, or menu items.
- Use local React state unless the prompt explicitly says to connect Supabase.
- Keep `USE_SUPABASE` set to `false` unless the prompt explicitly instructs otherwise.
- Reuse existing components, modals, toasts, and services before creating new ones.
- During polish tasks, do not add new major features.

Quick finish checklist:

- Routing still works.
- Translations are complete in English and Spanish.
- Mobile layout still works.
- User actions show toast feedback when appropriate.
- Archive, restore, and delete behavior still follows existing patterns.
- No visible dead buttons remain.
