import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.security import CurrentUser, get_current_user, require_role
from app.core.uow import UnitOfWork, get_uow
from app.modules.usuarios import service
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.schemas import (
    AssignRolRequest,
    ChangePasswordRequest,
    SetActivoRequest,
    UpdateProfileRequest,
    UserResponse,
)

router = APIRouter()


async def _get_usuario_model(
    current_user: CurrentUser = Depends(get_current_user),
    uow: UnitOfWork = Depends(get_uow),
) -> Usuario:
    """Dependency that loads the full Usuario ORM model for the authenticated user."""
    usuario = await uow.usuarios.get_by_id_active(current_user.id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No autenticado")
    return usuario


# ---------------------------------------------------------------------------
# Self-service endpoints (/me routes)
# ---------------------------------------------------------------------------


@router.get("/me", response_model=UserResponse)
async def get_me(
    usuario: Usuario = Depends(_get_usuario_model),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.get_me(usuario, uow)


@router.patch("/me", response_model=UserResponse)
async def update_me(
    data: UpdateProfileRequest,
    usuario: Usuario = Depends(_get_usuario_model),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.update_me(usuario, data, uow)


@router.patch("/me/password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    data: ChangePasswordRequest,
    usuario: Usuario = Depends(_get_usuario_model),
    uow: UnitOfWork = Depends(get_uow),
):
    await service.change_password(usuario, data, uow)


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_me(
    usuario: Usuario = Depends(_get_usuario_model),
    uow: UnitOfWork = Depends(get_uow),
):
    await service.delete_me(usuario, uow)


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=dict)
async def admin_list_users(
    skip: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.admin_list_users(skip, limit, uow)


@router.get("/{id}", response_model=UserResponse)
async def admin_get_user(
    id: uuid.UUID,
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.admin_get_user(id, uow)


@router.patch("/{id}/activo", response_model=UserResponse)
async def admin_set_active(
    id: uuid.UUID,
    data: SetActivoRequest,
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.admin_set_active(id, data.is_active, uow)


@router.post("/{id}/roles", response_model=UserResponse)
async def admin_assign_role(
    id: uuid.UUID,
    data: AssignRolRequest,
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    return await service.admin_assign_role(id, data.rol_codigo, uow)


@router.delete("/{id}/roles/{rol}", status_code=status.HTTP_204_NO_CONTENT)
async def admin_remove_role(
    id: uuid.UUID,
    rol: str,
    _: CurrentUser = Depends(require_role(["ADMIN"])),
    uow: UnitOfWork = Depends(get_uow),
):
    await service.admin_remove_role(id, rol, uow)
