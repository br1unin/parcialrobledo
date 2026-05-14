import uuid

from sqlmodel import select

from app.core.repository import BaseRepository
from app.modules.usuarios.model import Usuario, UsuarioRol


class UsuarioRepository(BaseRepository[Usuario]):
    def __init__(self, session):
        super().__init__(session, Usuario)

    async def get_by_email(self, email: str) -> Usuario | None:
        stmt = select(Usuario).where(Usuario.email == email, Usuario.deleted_at.is_(None))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_roles(self, usuario_id: uuid.UUID) -> list[str]:
        stmt = select(UsuarioRol.rol_codigo).where(UsuarioRol.usuario_id == usuario_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def assign_role(self, usuario_id: uuid.UUID, rol_codigo: str) -> None:
        link = UsuarioRol(usuario_id=usuario_id, rol_codigo=rol_codigo)
        self.session.add(link)
        await self.session.flush()
