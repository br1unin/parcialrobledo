# Tasks: us-008-direcciones

## Backend — Direcciones Module

- [x] Create `app/modules/direcciones/repository.py` — `DireccionRepository(BaseRepository[DireccionEntrega])` with:
  - `list_by_usuario(usuario_id)` — activas (deleted_at IS NULL) del usuario
  - `get_own(id, usuario_id)` — retorna la dirección solo si es del usuario y no está eliminada; None si no
  - `count_activas(usuario_id)` — cuenta direcciones activas del usuario
  - `get_oldest_activa(usuario_id)` — dirección activa más antigua (menor created_at), excluye un id dado
  - `unset_all_principal(usuario_id)` — UPDATE SET es_principal=False WHERE usuario_id AND deleted_at IS NULL
  - `set_principal(id)` — UPDATE SET es_principal=True WHERE id
- [x] Create `app/modules/direcciones/schemas.py`:
  - `DireccionCreate(calle, numero, departamento?, comuna, ciudad, codigo_postal?)`
  - `DireccionUpdate(calle?, numero?, departamento?, comuna?, ciudad?, codigo_postal?)` — todos opcionales
  - `DireccionResponse(id, calle, numero, departamento, comuna, ciudad, codigo_postal, es_principal, created_at)`
- [x] Create `app/modules/direcciones/service.py`:
  - `create_direccion(uow, usuario_id, data)` — si count_activas==0 fuerza es_principal=True; crea y retorna
  - `list_direcciones(uow, usuario_id)` — lista activas del usuario
  - `update_direccion(uow, id, usuario_id, data)` — valida ownership con get_own (404 si None); aplica cambios
  - `delete_direccion(uow, id, usuario_id)` — valida ownership; soft delete; si era principal y hay otras, llama get_oldest_activa y set_principal
  - `set_predeterminada(uow, id, usuario_id)` — valida ownership; llama unset_all_principal luego set_principal
- [x] Create `app/modules/direcciones/router.py`:
  - `POST /` (auth) → `create_direccion` → 201
  - `GET /` (auth) → `list_direcciones` → 200 con lista
  - `PATCH /{id}` (auth) → `update_direccion` → 200
  - `DELETE /{id}` (auth) → `delete_direccion` → 204
  - `PATCH /{id}/predeterminada` (auth) → `set_predeterminada` → 200
- [x] Add `direcciones` property to `app/core/uow.py`
- [x] Register direcciones router in `app/main.py` at prefix `/api/v1/direcciones`

## Frontend — Direcciones Feature

- [x] Create `frontend/src/features/direcciones/types.ts` — `DireccionEntrega`, `DireccionCreate`, `DireccionUpdate`, interfaces
- [x] Create `frontend/src/features/direcciones/api.ts` — `direccionesApi` with `list()`, `create(data)`, `update(id, data)`, `delete(id)`, `setPredeterminada(id)`
- [x] Create `frontend/src/features/direcciones/ui/DireccionForm.tsx` — formulario create/edit (calle, numero, departamento opcional, comuna, ciudad, codigo_postal opcional); usa TanStack Form; onSubmit recibe datos y llama callback del padre
- [x] Create `frontend/src/features/direcciones/ui/DireccionList.tsx` — lista de DireccionEntrega con badge "Predeterminada" en es_principal=true; botones: "Establecer predeterminada" (si no es principal), "Editar", "Eliminar"; usa TanStack Query para invalidar
- [x] Create `frontend/src/pages/DireccionesPage.tsx` — protegida (requiere auth); compone `DireccionList` + `DireccionForm` (modal o inline); título "Mis Direcciones"
- [x] Add route `/mis-direcciones` in `frontend/src/app/router.tsx` → `<DireccionesPage />` wrapped in `<PrivateRoute>`
- [x] Add link a `/mis-direcciones` en `HomePage` nav para usuarios autenticados
