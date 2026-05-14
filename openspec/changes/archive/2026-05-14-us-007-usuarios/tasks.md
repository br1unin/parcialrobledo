## 1. Extend UsuarioRepository

- [x] 1.1 Add `get_by_id_active(id: UUID) -> Usuario | None` — returns user only if `deleted_at IS NULL`
- [x] 1.2 Add `list_all(skip: int, limit: int) -> list[Usuario]` — all users regardless of status, ordered by `created_at DESC`
- [x] 1.3 Add `count_all() -> int` — total user count for pagination
- [x] 1.4 Add `deactivate(usuario: Usuario) -> Usuario` — sets `is_active = False` and flushes
- [x] 1.5 Add `soft_delete(usuario: Usuario) -> Usuario` — sets `deleted_at = datetime.utcnow()` and flushes
- [x] 1.6 Add `set_active(usuario: Usuario, value: bool) -> Usuario` — sets `is_active = value` and flushes
- [x] 1.7 Add `delete_role(usuario_id: UUID, rol_codigo: str) -> None` — removes UsuarioRol row (idempotent, no error if missing)
- [x] 1.8 Add `count_admins() -> int` — counts users with ADMIN role and `deleted_at IS NULL`

## 2. Extend schemas.py

- [x] 2.1 Add `UpdateProfileRequest` — optional fields: `nombre: str | None`, `apellido: str | None`, `telefono: str | None`
- [x] 2.2 Add `ChangePasswordRequest` — required fields: `current_password: str`, `new_password: str` (min_length=8)
- [x] 2.3 Add `SetActivoRequest` — required field: `is_active: bool`
- [x] 2.4 Add `AssignRolRequest` — required field: `rol_codigo: str`
- [x] 2.5 Extend `UserResponse` to include `telefono: str | None`, `is_active: bool`, `created_at: datetime`

## 3. Add usuarios property to UnitOfWork

- [x] 3.1 Import `UsuarioRepository` in `app/core/uow.py`
- [x] 3.2 Add `usuarios` property to `UnitOfWork` returning `UsuarioRepository(self.session)`

## 4. Update get_current_user to reject soft-deleted users

- [x] 4.1 In `app/core/security.py` — after loading the user in `get_current_user`, check `if usuario.deleted_at is not None: raise HTTPException(401)`
- [x] 4.2 Verify that the existing `is_active` check is present in `get_current_user` (add if missing)

## 5. Update auth login to reject soft-deleted users

- [x] 5.1 In `app/modules/auth/service.py` (or wherever login logic lives) — after loading user by email, check `deleted_at IS NULL` before comparing password; return generic 401 if deleted

## 6. Implement UsuarioService

- [x] 6.1 Create `app/modules/usuarios/service.py`
- [x] 6.2 Implement `get_me(usuario: Usuario) -> UserResponse` — returns profile with roles
- [x] 6.3 Implement `update_me(usuario: Usuario, data: UpdateProfileRequest, uow) -> UserResponse` — partial update of nombre/apellido/telefono
- [x] 6.4 Implement `change_password(usuario: Usuario, data: ChangePasswordRequest, uow) -> None` — verify current_password, hash new_password, update password_hash
- [x] 6.5 Implement `delete_me(usuario: Usuario, uow) -> None` — soft_delete + revoke all refresh tokens
- [x] 6.6 Implement `admin_list_users(skip: int, limit: int, uow) -> dict` — returns `{ items, total, skip, limit }`
- [x] 6.7 Implement `admin_get_user(id: UUID, uow) -> UserResponse` — get by id, 404 if not found
- [x] 6.8 Implement `admin_set_active(id: UUID, value: bool, uow) -> UserResponse` — toggle is_active
- [x] 6.9 Implement `admin_assign_role(id: UUID, rol_codigo: str, uow) -> UserResponse` — validate rol exists, assign idempotently
- [x] 6.10 Implement `admin_remove_role(id: UUID, rol_codigo: str, uow) -> None` — remove role, guard last-ADMIN check, idempotent

## 7. Implement UsuarioRouter

- [x] 7.1 Create `app/modules/usuarios/router.py`
- [x] 7.2 Add `GET /me` — `get_current_user` dependency, calls `service.get_me`
- [x] 7.3 Add `PATCH /me` — `get_current_user` dependency, body `UpdateProfileRequest`, calls `service.update_me`
- [x] 7.4 Add `PATCH /me/password` — `get_current_user` dependency, body `ChangePasswordRequest`, calls `service.change_password`, returns 204
- [x] 7.5 Add `DELETE /me` — `get_current_user` dependency, calls `service.delete_me`, returns 204
- [x] 7.6 Add `GET /` — `require_role(["ADMIN"])` dependency, query params skip/limit, calls `service.admin_list_users`
- [x] 7.7 Add `GET /{id}` — `require_role(["ADMIN"])` dependency, calls `service.admin_get_user`
- [x] 7.8 Add `PATCH /{id}/activo` — `require_role(["ADMIN"])` dependency, body `SetActivoRequest`, calls `service.admin_set_active`
- [x] 7.9 Add `POST /{id}/roles` — `require_role(["ADMIN"])` dependency, body `AssignRolRequest`, calls `service.admin_assign_role`
- [x] 7.10 Add `DELETE /{id}/roles/{rol}` — `require_role(["ADMIN"])` dependency, calls `service.admin_remove_role`, returns 204

## 8. Register Router in main.py

- [x] 8.1 Import `usuarios_router` in `app/main.py`
- [x] 8.2 Include router with prefix `/api/v1/usuarios` and tag `usuarios`

## 9. Frontend — API client

- [x] 9.1 Create `frontend/src/api/usuarios.ts` with typed fetch functions: `getMe`, `updateMe`, `changePassword`, `deleteMe`

## 10. Frontend — ProfilePage

- [x] 10.1 Create `frontend/src/pages/ProfilePage.tsx`
- [x] 10.2 Add read-only profile view section (nombre, apellido, email, telefono, roles)
- [x] 10.3 Add edit profile form with `UpdateProfileRequest` fields and submit via `useMutation`
- [x] 10.4 Add change password form with current_password + new_password fields and submit via `useMutation`
- [x] 10.5 Add delete account section with confirmation dialog; on confirm call `deleteMe` and redirect to login
- [x] 10.6 Wire `useQuery` for profile fetch and update Zustand auth store on successful profile update
- [x] 10.7 Add route `/perfil` to React Router config pointing to `ProfilePage`
- [x] 10.8 Add "Mi Perfil" link in navigation/header for authenticated users

## 11. Manual Integration Tests

- [x] 11.1 Test: register → login → GET /me → verify profile fields
- [x] 11.2 Test: PATCH /me → update nombre → verify response + DB
- [x] 11.3 Test: PATCH /me/password → correct current → verify 204 + login with new password
- [x] 11.4 Test: PATCH /me/password → wrong current → verify 401
- [x] 11.5 Test: DELETE /me → verify 204 → GET /me with old JWT → verify 401
- [x] 11.6 Test: Admin GET /usuarios → verify pagination fields
- [x] 11.7 Test: Admin PATCH /{id}/activo → deactivate → verify user gets 401 on next request
- [x] 11.8 Test: Admin POST /{id}/roles → assign STOCK → verify in UserResponse
- [x] 11.9 Test: Admin DELETE /{id}/roles/ADMIN → last admin → verify 409
- [x] 11.10 Test: CLIENT tries GET /usuarios → verify 403
