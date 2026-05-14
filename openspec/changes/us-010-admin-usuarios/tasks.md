## 1. Types

- [x] 1.1 Add `AdminUserListResponse` type to `frontend/src/types/admin.ts` — `{ items: UserResponse[], total: number, skip: number, limit: number }`

## 2. API Layer

- [x] 2.1 Add `adminUsuariosApi.listUsers(skip: number, limit: number)` to `frontend/src/api/usuarios.ts` calling `GET /api/v1/usuarios/?skip={skip}&limit={limit}`
- [x] 2.2 Add `adminUsuariosApi.getUser(id: string)` to `frontend/src/api/usuarios.ts` calling `GET /api/v1/usuarios/{id}`
- [x] 2.3 Add `adminUsuariosApi.setActive(id: string, is_active: boolean)` to `frontend/src/api/usuarios.ts` calling `PATCH /api/v1/usuarios/{id}/activo`
- [x] 2.4 Add `adminUsuariosApi.assignRole(id: string, rol_codigo: string)` to `frontend/src/api/usuarios.ts` calling `POST /api/v1/usuarios/{id}/roles`
- [x] 2.5 Add `adminUsuariosApi.removeRole(id: string, rol: string)` to `frontend/src/api/usuarios.ts` calling `DELETE /api/v1/usuarios/{id}/roles/{rol}`

## 3. AdminUsuariosPage — Scaffolding and Data Fetching

- [x] 3.1 Create `frontend/src/pages/admin/AdminUsuariosPage.tsx` with the component shell, page title, "← Volver" link to `/admin`, and local pagination state (`skip`, `limit = 20`)
- [x] 3.2 Wire React Query `useQuery` with `queryKey: ['admin', 'usuarios', skip]` calling `adminUsuariosApi.listUsers(skip, 20)`
- [x] 3.3 Render loading state (`TabLoader`-style div) while query is fetching
- [x] 3.4 Render error state message when query fails

## 4. AdminUsuariosPage — Table

- [x] 4.1 Render the user table with columns: Email, Nombre, Apellido, Roles, Estado, Fecha Registro — one row per user in `data.items`
- [x] 4.2 Display `created_at` formatted as `DD/MM/YYYY` (no external library needed — use `new Date().toLocaleDateString('es-AR')`)
- [x] 4.3 Display `is_active` as a colored badge: "Activo" (green) / "Inactivo" (red)

## 5. AdminUsuariosPage — Search Filter

- [x] 5.1 Add a search text input above the table
- [x] 5.2 Filter displayed rows client-side: show only users whose `email`, `nombre`, or `apellido` contains the search string (case-insensitive)

## 6. AdminUsuariosPage — Activate/Deactivate Toggle

- [x] 6.1 Add a toggle button on each row wired to `useMutation` calling `adminUsuariosApi.setActive(user.id, !user.is_active)`
- [x] 6.2 On mutation success, call `queryClient.invalidateQueries({ queryKey: ['admin', 'usuarios'] })` to refresh the list
- [x] 6.3 Disable the toggle button while the mutation is pending (use `isPending` from `useMutation`)

## 7. AdminUsuariosPage — Role Badges and Remove Role

- [x] 7.1 Render each user's roles as inline badges (pill style, e.g., `<span className="...">STOCK ×</span>`)
- [x] 7.2 Wire the `×` button on each badge to `useMutation` calling `adminUsuariosApi.removeRole(user.id, rol)` — invalidate `['admin', 'usuarios']` on success
- [x] 7.3 Show an inline error message on the row when the remove mutation fails with HTTP 409 ("No se puede eliminar el último administrador")

## 8. AdminUsuariosPage — Add Role

- [x] 8.1 Add a `<select>` dropdown per row with options: ADMIN, STOCK, PEDIDOS, CLIENT (static list; pre-select the first option not already assigned or leave a placeholder "Agregar rol…")
- [x] 8.2 Add an "Agregar" button per row wired to `useMutation` calling `adminUsuariosApi.assignRole(user.id, selectedRole)` — invalidate `['admin', 'usuarios']` on success
- [x] 8.3 Disable the "Agregar" button while the assign mutation is pending

## 9. AdminUsuariosPage — Pagination Controls

- [x] 9.1 Render Prev/Next buttons below the table; "Anterior" is disabled when `skip === 0`
- [x] 9.2 "Siguiente" is disabled when `skip + limit >= data.total`
- [x] 9.3 Display current page info: e.g., "Mostrando {skip + 1}–{Math.min(skip + limit, total)} de {total}"

## 10. Routing

- [x] 10.1 Import `AdminUsuariosPage` in `frontend/src/app/router.tsx`
- [x] 10.2 Add route `<Route path="/admin/usuarios" element={<AdminRoute><AdminUsuariosPage /></AdminRoute>} />` in the `<Routes>` block

## 11. Navigation Link in AdminPage

- [x] 11.1 Add a `<Link to="/admin/usuarios">` labelled "Gestión de Usuarios" in `frontend/src/pages/admin/AdminPage.tsx`, visible near the existing "← Volver" link or as a standalone action button in the page header
