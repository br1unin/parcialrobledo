import uuid
from datetime import datetime

from fastapi import HTTPException, status

from app.core.uow import UnitOfWork
from app.modules.categorias.model import Categoria
from app.modules.categorias.schemas import CategoriaCreate, CategoriaResponse, CategoriaUpdate


def _build_tree(rows: list[Categoria]) -> list[CategoriaResponse]:
    by_id: dict[uuid.UUID, CategoriaResponse] = {
        r.id: CategoriaResponse.model_validate(r) for r in rows
    }
    roots: list[CategoriaResponse] = []
    for r in rows:
        if r.padre_id is None:
            roots.append(by_id[r.id])
        else:
            parent = by_id.get(r.padre_id)
            if parent:
                parent.children.append(by_id[r.id])
    return roots


async def get_tree(uow: UnitOfWork) -> list[CategoriaResponse]:
    rows = await uow.categorias.get_tree()
    return _build_tree(rows)


async def create_categoria(uow: UnitOfWork, data: CategoriaCreate) -> CategoriaResponse:
    if data.padre_id is not None:
        parent = await uow.categorias.get_by_id(data.padre_id)
        if parent is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría padre no encontrada")

    categoria = Categoria(
        nombre=data.nombre,
        descripcion=data.descripcion,
        padre_id=data.padre_id,
        imagen_url=data.imagen_url,
    )
    created = await uow.categorias.create(categoria)
    return CategoriaResponse.model_validate(created)


async def update_categoria(uow: UnitOfWork, categoria_id: uuid.UUID, data: CategoriaUpdate) -> CategoriaResponse:
    categoria = await uow.categorias.get_by_id(categoria_id)
    if categoria is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")

    if data.padre_id is not None and data.padre_id != categoria.padre_id:
        if data.padre_id == categoria_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Una categoría no puede ser su propio padre")

        new_parent = await uow.categorias.get_by_id(data.padre_id)
        if new_parent is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría padre no encontrada")

        ancestor_ids = await uow.categorias.get_ancestors_ids(data.padre_id)
        if categoria_id in ancestor_ids:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Esta operación crearía un ciclo en la jerarquía de categorías",
            )

    if data.nombre is not None:
        categoria.nombre = data.nombre
    if data.descripcion is not None:
        categoria.descripcion = data.descripcion
    if data.padre_id is not None:
        categoria.padre_id = data.padre_id
    if data.imagen_url is not None:
        categoria.imagen_url = data.imagen_url
    categoria.updated_at = datetime.utcnow()

    updated = await uow.categorias.update(categoria)
    return CategoriaResponse.model_validate(updated)


async def delete_categoria(uow: UnitOfWork, categoria_id: uuid.UUID) -> None:
    categoria = await uow.categorias.get_by_id(categoria_id)
    if categoria is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")

    children_count = await uow.categorias.count_children(categoria_id)
    if children_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar una categoría que tiene subcategorías activas",
        )

    productos_count = await uow.categorias.count_productos(categoria_id)
    if productos_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar una categoría que tiene productos asociados",
        )

    await uow.categorias.soft_delete(categoria)
