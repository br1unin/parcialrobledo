## Context

The backend for admin user management is fully implemented in `app/modules/usuarios/router.py`. The frontend admin area already has two protected pages (`/admin` and `/admin/dashboard`) and an `AdminRoute` guard. The project uses React Query for server state, Zustand for auth state, Tailwind CSS for styling, and `axiosInstance` for HTTP — all available via existing imports.

The existing `frontend/src/api/usuarios.ts` covers only the `/me` family of endpoints. The existing `frontend/src/types/admin.ts` file already holds domain types for the admin module. The `frontend/src/shared/types.ts` already defines `UserResponse` (the shape returned by all user endpoints).

## Goals / Non-Goals

**Goals:**
- Extend the API layer with 5 admin user management functions that call the already-implemented backend endpoints.
- Create `AdminUsuariosPage` — a fully functional paginated user table with search, activate/deactivate toggle, and role badge management.
- Wire the new page to `/admin/usuarios` via `AdminRoute` and add a navigation link in `AdminPage`.

**Non-Goals:**
- No backend changes — all endpoints exist and are production-ready.
- No new npm dependencies.
- No bulk operations on users (out of scope for this sprint).
- No server-side search (client-side filter on the fetched page is sufficient given typical user counts in the demo environment).

## Decisions

### Decision 1: Extend `usuarios.ts` rather than create a new file

The existing `frontend/src/api/usuarios.ts` already exports `usuariosApi`. Adding an `adminUsuariosApi` object in the same file keeps API calls for the `usuarios` module co-located and avoids a proliferation of single-resource API files. Pattern matches how `adminApi` is structured in `admin.ts`.

**Alternative considered**: Create `frontend/src/api/adminUsuarios.ts`. Rejected because there is no naming conflict and the module boundary is already the file itself.

### Decision 2: Client-side search/filter

The paginated list fetches up to 100 users at a time. Filtering by email/nombre will be applied on the already-fetched items in the React component. This avoids a round-trip for each keystroke and is sufficient for a demo with tens of users.

**Alternative considered**: Pass a `q` query param to the backend. Rejected because the backend endpoint does not support a search param, and adding it is out of scope.

### Decision 3: Role management inline on each row

Each table row renders the user's current role badges. A small inline `<select>` dropdown lets the admin pick a role to add; each badge has an `×` button to remove. This avoids a separate detail modal and keeps the workflow fast for the typical "assign STOCK or PEDIDOS to a user" use case.

**Alternative considered**: Open a detail/edit modal per user. Rejected as over-engineered for this sprint; inline is simpler and consistent with the toggle-per-row pattern already used in `AdminPage` for payment methods.

### Decision 4: Navigation link in `AdminPage` (not a new shared nav component)

The `AdminPage` currently renders a standalone tab-based panel with a "← Volver" link. Adding a `Link` to `/admin/usuarios` at the top of this page (alongside the back link) keeps the navigation change minimal and avoids creating a new shared layout component.

**Alternative considered**: Create a shared `AdminNav` sidebar. Rejected as scope creep; this sprint only needs a link visible to admins.

### Decision 5: Types in `frontend/src/types/admin.ts`

The pagination wrapper type (`AdminUserListResponse`) will be added to the existing `frontend/src/types/admin.ts`, keeping admin-domain types co-located. `UserResponse` already lives in `frontend/src/shared/types.ts` and will be reused as-is for individual user items.

## Risks / Trade-offs

- [Client-side search only] → If the admin database grows beyond a few hundred users, filtering will feel slow. Mitigation: `limit` is capped at 100; in the demo, this is never a problem. A server-side search param can be added in a follow-up.
- [Pagination UX] → Server returns `{ items, total, skip, limit }`. The page will render simple Prev/Next buttons with page number display. With `limit=20`, most demo environments fit on one or two pages.
- [Removing last ADMIN guarded server-side] → The backend already returns HTTP 409 when the last ADMIN role would be removed. The frontend will surface this as an error toast/message without needing extra client-side checks.

## Migration Plan

No database migration or environment changes needed. The change is purely additive frontend code.

1. Add API functions to `frontend/src/api/usuarios.ts`.
2. Add `AdminUserListResponse` type to `frontend/src/types/admin.ts`.
3. Create `frontend/src/pages/admin/AdminUsuariosPage.tsx`.
4. Add the `/admin/usuarios` route in `frontend/src/app/router.tsx`.
5. Add the navigation link in `frontend/src/pages/admin/AdminPage.tsx`.

Rollback: remove the route and the new file. No persistent state is changed.

## Open Questions

- None. All backend contracts are stable and already spec'd in `user-profile-management`.
