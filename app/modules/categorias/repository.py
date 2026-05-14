import uuid

from sqlalchemy import func, select, text

from app.core.repository import BaseRepository
from app.modules.categorias.model import Categoria


class CategoriaRepository(BaseRepository[Categoria]):
    def __init__(self, session):
        super().__init__(session, Categoria)

    async def get_tree(self) -> list[Categoria]:
        stmt = text("""
            WITH RECURSIVE tree AS (
                SELECT id, nombre, descripcion, padre_id, imagen_url, deleted_at, created_at, updated_at
                FROM categoria
                WHERE padre_id IS NULL AND deleted_at IS NULL
                UNION ALL
                SELECT c.id, c.nombre, c.descripcion, c.padre_id, c.imagen_url, c.deleted_at, c.created_at, c.updated_at
                FROM categoria c
                JOIN tree t ON c.padre_id = t.id
                WHERE c.deleted_at IS NULL
            )
            SELECT * FROM tree
        """)
        result = await self.session.execute(stmt)
        rows = result.mappings().all()
        return [Categoria(**dict(r)) for r in rows]

    async def get_ancestors_ids(self, categoria_id: uuid.UUID) -> list[uuid.UUID]:
        """Return IDs of all ancestors of categoria_id (excluding itself)."""
        stmt = text("""
            WITH RECURSIVE ancestors AS (
                SELECT id, padre_id FROM categoria WHERE id = :start_id
                UNION ALL
                SELECT c.id, c.padre_id FROM categoria c
                JOIN ancestors a ON c.id = a.padre_id
            )
            SELECT id FROM ancestors WHERE id != :start_id
        """)
        result = await self.session.execute(stmt, {"start_id": categoria_id})
        return [row[0] for row in result.fetchall()]

    async def count_productos(self, categoria_id: uuid.UUID) -> int:
        from app.modules.productos.model import ProductoCategoria
        stmt = select(func.count()).select_from(ProductoCategoria).where(
            ProductoCategoria.categoria_id == categoria_id
        )
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def count_children(self, categoria_id: uuid.UUID) -> int:
        stmt = select(func.count()).select_from(Categoria).where(
            Categoria.padre_id == categoria_id,
            Categoria.deleted_at.is_(None),
        )
        result = await self.session.execute(stmt)
        return int(result.scalar_one())
