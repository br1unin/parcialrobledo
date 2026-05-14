import uuid
from datetime import datetime

from sqlmodel import func, select

from app.core.repository import BaseRepository
from app.modules.usuarios.model import Usuario, UsuarioRol


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session):
        super().__init__(session, Usuario)

    async def get_by_email(self, email: str) -> Usuario | None:
        stmt = select(Usuario).where(Usuario.email == email, Usuario.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_id_active(self, id: uuid.UUID) -> Usuario | None:
        """Returns user only if deleted_at IS NULL."""
        stmt = select(Usuario).where(Usuario.id == id, Usuario.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(self, skip: int = 0, limit: int = 20) -> list[Usuario]:
        """All users regardless of status, ordered by created_at DESC."""
        stmt = select(Usuario).order_by(Usuario.created_at.desc()).offset(skip).limit(limit)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_all(self) -> int:
        """Total user count for pagination (all users, no filter)."""
        stmt = select(func.count()).select_from(Usuario)
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def deactivate(self, usuario: Usuario) -> Usuario:
        """Sets is_active = False and flushes."""
        usuario.is_active = False
        self.session.add(usuario)
        await self.session.flush()
        await self.session.refresh(usuario)
        return usuario

    async def soft_delete(self, usuario: Usuario) -> Usuario:
        """Sets deleted_at = now() and flushes."""
        usuario.deleted_at = datetime.utcnow()
        self.session.add(usuario)
        await self.session.flush()
        await self.session.refresh(usuario)
        return usuario

    async def set_active(self, usuario: Usuario, value: bool) -> Usuario:
        """Sets is_active = value and flushes."""
        usuario.is_active = value
        self.session.add(usuario)
        await self.session.flush()
        await self.session.refresh(usuario)
        return usuario

    async def delete_role(self, usuario_id: uuid.UUID, rol_codigo: str) -> None:
        """Removes UsuarioRol row. Idempotent — no error if missing."""
        stmt = select(UsuarioRol).where(
            UsuarioRol.usuario_id == usuario_id,
            UsuarioRol.rol_codigo == rol_codigo,
        )
        result = await self.session.execute(stmt)
        link = result.scalar_one_or_none()
        if link is not None:
            await self.session.delete(link)
            await self.session.flush()

    async def count_admins(self) -> int:
        """Counts users with ADMIN role and deleted_at IS NULL."""
        stmt = (
            select(func.count())
            .select_from(UsuarioRol)
            .join(Usuario, Usuario.id == UsuarioRol.usuario_id)
            .where(UsuarioRol.rol_codigo == "ADMIN", Usuario.deleted_at.is_(None))
        )
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def get_roles(self, usuario_id: uuid.UUID) -> list[str]:
        stmt = select(UsuarioRol.rol_codigo).where(UsuarioRol.usuario_id == usuario_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def assign_role(self, usuario_id: uuid.UUID, rol_codigo: str) -> None:
        # Idempotent: only insert if the link doesn't already exist
        stmt = select(UsuarioRol).where(
            UsuarioRol.usuario_id == usuario_id,
            UsuarioRol.rol_codigo == rol_codigo,
        )
        result = await self.session.execute(stmt)
        if result.scalar_one_or_none() is None:
            link = UsuarioRol(usuario_id=usuario_id, rol_codigo=rol_codigo)
            self.session.add(link)
            await self.session.flush()
