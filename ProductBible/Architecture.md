# Architecture

Current structure:

- `src/pages`: route-level screens and route wrappers.
- `src/components`: reusable UI, layout, modal, and feature components.
- `src/services`: data-access and backend-ready service layer.
- `src/hooks`: reusable state and behavior hooks.
- `src/translations`: English, Spanish, and translator helpers.
- `src/contexts`: shared app context when needed.
- `src/utils`: pure helpers and formatting utilities.
- `src/lib`: infrastructure clients such as Supabase helpers.
- `src/config`: feature and backend configuration.
- `src/data`: mock data that supports local-state flows.

Architecture rules:

- Keep route orchestration near the app shell, but move feature logic down into pages, hooks, services, and components.
- Prefer service-layer access over direct backend calls from UI code.
- Preserve the current local-state-first architecture until Supabase work is explicitly requested.
