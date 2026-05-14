## Why

The admin backend for user management is fully implemented (`GET/PATCH/POST/DELETE /api/v1/usuarios/…`) but no admin UI exists yet to exercise those endpoints. Without this page, administrators must use raw API calls to manage user accounts and role assignments — an unworkable experience for the sprint demo.

## What Changes

- **New API module**: Admin-scoped functions added to (or alongside) `frontend/src/api/usuarios.ts` to cover list, get, activate/deactivate, assign role, and remove role.
- **New page**: `frontend/src/pages/admin/AdminUsuariosPage.tsx` — paginated user table with toggle active/inactive, role badge management (add / remove), and search/filter.
- **New route**: `/admin/usuarios` protected by the existing `AdminRoute` guard, pointing to `AdminUsuariosPage`.
- **Navigation update**: A "Gestión de Usuarios" link added to the admin navigation (in `AdminPage.tsx` or shared admin nav) so the new page is reachable from the admin panel.

## Capabilities

### New Capabilities
- `admin-user-management-ui`: Frontend UI for ADMIN users to list, search, activate/deactivate, and assign/remove roles on all registered users.

### Modified Capabilities
- `admin-management`: The admin frontend configuration panel gains a navigation link to the new Gestión de Usuarios page.

## Impact

- **Frontend files touched**:
  - `frontend/src/api/usuarios.ts` (or new `frontend/src/api/adminUsuarios.ts`) — 5 new API functions
  - `frontend/src/pages/admin/AdminUsuariosPage.tsx` — new page (created)
  - `frontend/src/pages/admin/AdminPage.tsx` — navigation link added
  - `frontend/src/App.tsx` (or router file) — new `/admin/usuarios` route added
- **Backend**: No changes required — all endpoints already exist and are production-ready.
- **Auth**: Uses existing `useAuthStore` (Zustand) for the bearer token; the `AdminRoute` guard already enforces the ADMIN role.
- **Dependencies**: No new npm packages required — React Query for data fetching, Tailwind for styling, and the existing `axiosInstance` (or equivalent) for HTTP are all already in the project.
