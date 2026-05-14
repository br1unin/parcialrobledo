import uuid

from fastapi import HTTPException, status

from app.core.security import hash_password, verify_password
from app.core.uow import UnitOfWork
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.schemas import (
    ChangePasswordRequest,
    UpdateProfileRequest,
    UserResponse,
)


async def _build_user_response(usuario: Usuario, uow: UnitOfWork) -> UserResponse:
    """Build a UserResponse including the user's current roles."""
    roles = await uow.usuarios.get_roles(usuario.id)
    return UserResponse(
        id=usuario.id,
        email=usuario.email,
        nombre=usuario.nombre,
        apellido=usuario.apellido,
        telefono=usuario.telefono,
        is_active=usuario.is_active,
        created_at=usuario.created_at,
        roles=roles,
    )


async def get_me(usuario: Usuario, uow: UnitOfWork) -> UserResponse:
    """Returns the current user's profile with roles."""
    return await _build_user_response(usuario, uow)


async def update_me(
    usuario: Usuario,
    data: UpdateProfileRequest,
    uow: UnitOfWork,
) -> UserResponse:
    """Partial update of nombre/apellido/telefono."""
    if data.nombre is not None:
        usuario.nombre = data.nombre
    if data.apellido is not None:
        usuario.apellido = data.apellido
    if data.telefono is not None:
        usuario.telefono = data.telefono
    uow.session.add(usuario)
    await uow.session.flush()
    await uow.session.refresh(usuario)
    return await _build_user_response(usuario, uow)


async def change_password(
    usuario: Usuario,
    data: ChangePasswordRequest,
    uow: UnitOfWork,
) -> None:
    """Verify current_password, hash and store new_password."""
    if not await verify_password(data.current_password, usuario.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Contraseña actual incorrecta",
        )
    usuario.password_hash = await hash_password(data.new_password)
    uow.session.add(usuario)
    await uow.session.flush()


async def delete_me(usuario: Usuario, uow: UnitOfWork) -> None:
    """Soft-delete the current user and revoke all their refresh tokens."""
    await uow.usuarios.soft_delete(usuario)
    await uow.refresh_tokens.revoke_all_for_user(usuario.id)


async def admin_list_users(
    skip: int,
    limit: int,
    uow: UnitOfWork,
) -> dict:
    """Returns paginated user list: { items, total, skip, limit }."""
    items_raw = await uow.usuarios.list_all(skip=skip, limit=limit)
    total = await uow.usuarios.count_all()
    items = []
    for u in items_raw:
        roles = await uow.usuarios.get_roles(u.id)
        items.append(
            UserResponse(
                id=u.id,
                email=u.email,
                nombre=u.nombre,
                apellido=u.apellido,
                telefono=u.telefono,
                is_active=u.is_active,
                created_at=u.created_at,
                roles=roles,
            )
        )
    return {"items": items, "total": total, "skip": skip, "limit": limit}


async def admin_get_user(id: uuid.UUID, uow: UnitOfWork) -> UserResponse:
    """Get user by id. 404 if not found (including deleted)."""
    # Admins can view any user including soft-deleted — use get_by_id which includes deleted
    from app.modules.usuarios.repository import UsuarioRepository

    repo = UsuarioRepository(uow.session)
    usuario = await repo.get_by_id(id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    return await _build_user_response(usuario, uow)


async def admin_set_active(
    id: uuid.UUID,
    value: bool,
    uow: UnitOfWork,
) -> UserResponse:
    """Toggle is_active for the given user."""
    from app.modules.usuarios.repository import UsuarioRepository

    repo = UsuarioRepository(uow.session)
    usuario = await repo.get_by_id(id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    await uow.usuarios.set_active(usuario, value)
    return await _build_user_response(usuario, uow)


async def admin_assign_role(
    id: uuid.UUID,
    rol_codigo: str,
    uow: UnitOfWork,
) -> UserResponse:
    """Validate role exists, assign idempotently."""
    from app.modules.admin.model import Rol
    from app.modules.usuarios.repository import UsuarioRepository
    from sqlmodel import select

    # Validate role exists
    stmt = select(Rol).where(Rol.codigo == rol_codigo)
    result = await uow.session.execute(stmt)
    if result.scalar_one_or_none() is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Rol '{rol_codigo}' no encontrado",
        )

    repo = UsuarioRepository(uow.session)
    usuario = await repo.get_by_id(id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    await uow.usuarios.assign_role(usuario.id, rol_codigo)
    return await _build_user_response(usuario, uow)


async def admin_remove_role(
    id: uuid.UUID,
    rol_codigo: str,
    uow: UnitOfWork,
) -> None:
    """Remove role from user. Guard: cannot remove ADMIN if user is the only admin."""
    from app.modules.usuarios.repository import UsuarioRepository

    repo = UsuarioRepository(uow.session)
    usuario = await repo.get_by_id(id)
    if usuario is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")

    if rol_codigo == "ADMIN":
        # Guard: check that at least one other admin exists
        admin_count = await uow.usuarios.count_admins()
        user_roles = await uow.usuarios.get_roles(id)
        if "ADMIN" in user_roles and admin_count <= 1:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se puede quitar el rol ADMIN al único administrador del sistema",
            )

    await uow.usuarios.delete_role(id, rol_codigo)
