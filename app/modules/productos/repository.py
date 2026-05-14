import uuid
from typing import Any

from sqlalchemy import delete, func, select

from app.core.repository import BaseRepository
from app.modules.productos.model import (
    Ingrediente,
    Producto,
    ProductoCategoria,
    ProductoIngrediente,
)


class ProductoRepository(BaseRepository[Producto]):
    def __init__(self, session):
        super().__init__(session, Producto)

    async def list_catalog(
        self,
        skip: int,
        limit: int,
        categoria_id: uuid.UUID | None = None,
        busqueda: str | None = None,
        excluir_alergenos: list[uuid.UUID] | None = None,
    ) -> list[Producto]:
        stmt = select(Producto).where(
            Producto.disponible.is_(True),
            Producto.deleted_at.is_(None),
        )
        if categoria_id is not None:
            stmt = stmt.join(
                ProductoCategoria,
                ProductoCategoria.producto_id == Producto.id,
            ).where(ProductoCategoria.categoria_id == categoria_id)
        if busqueda:
            stmt = stmt.where(Producto.nombre.ilike(f"%{busqueda}%"))
        if excluir_alergenos:
            sub = (
                select(ProductoIngrediente.producto_id)
                .join(Ingrediente, Ingrediente.id == ProductoIngrediente.ingrediente_id)
                .where(Ingrediente.id.in_(excluir_alergenos))
            )
            stmt = stmt.where(~Producto.id.in_(sub))
        stmt = stmt.offset(skip).limit(limit).order_by(Producto.nombre)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def count_catalog(
        self,
        categoria_id: uuid.UUID | None = None,
        busqueda: str | None = None,
        excluir_alergenos: list[uuid.UUID] | None = None,
    ) -> int:
        stmt = select(func.count()).select_from(Producto).where(
            Producto.disponible.is_(True),
            Producto.deleted_at.is_(None),
        )
        if categoria_id is not None:
            stmt = stmt.join(
                ProductoCategoria,
                ProductoCategoria.producto_id == Producto.id,
            ).where(ProductoCategoria.categoria_id == categoria_id)
        if busqueda:
            stmt = stmt.where(Producto.nombre.ilike(f"%{busqueda}%"))
        if excluir_alergenos:
            sub = (
                select(ProductoIngrediente.producto_id)
                .join(Ingrediente, Ingrediente.id == ProductoIngrediente.ingrediente_id)
                .where(Ingrediente.id.in_(excluir_alergenos))
            )
            stmt = stmt.where(~Producto.id.in_(sub))
        result = await self.session.execute(stmt)
        return int(result.scalar_one())

    async def get_categorias(self, producto_id: uuid.UUID) -> list[ProductoCategoria]:
        stmt = select(ProductoCategoria).where(ProductoCategoria.producto_id == producto_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def replace_categorias(self, producto_id: uuid.UUID, categoria_ids: list[uuid.UUID]) -> None:
        await self.session.execute(
            delete(ProductoCategoria).where(ProductoCategoria.producto_id == producto_id)
        )
        for cat_id in categoria_ids:
            self.session.add(ProductoCategoria(producto_id=producto_id, categoria_id=cat_id))
        await self.session.flush()

    async def get_ingredientes(self, producto_id: uuid.UUID) -> list[ProductoIngrediente]:
        stmt = select(ProductoIngrediente).where(ProductoIngrediente.producto_id == producto_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def replace_ingredientes(
        self,
        producto_id: uuid.UUID,
        items: list[dict[str, Any]],
    ) -> None:
        await self.session.execute(
            delete(ProductoIngrediente).where(ProductoIngrediente.producto_id == producto_id)
        )
        for item in items:
            self.session.add(
                ProductoIngrediente(
                    producto_id=producto_id,
                    ingrediente_id=item["ingrediente_id"],
                    es_removible=item["es_removible"],
                )
            )
        await self.session.flush()
