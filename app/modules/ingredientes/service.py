import uuid
from uuid import uuid4

from fastapi import HTTPException, status

from app.core.uow import UnitOfWork
from app.modules.productos.model import Ingrediente
from app.modules.ingredientes.schemas import (
    IngredienteCreate,
    IngredienteListResponse,
    IngredienteResponse,
    IngredienteUpdate,
)


async def create_ingrediente(uow: UnitOfWork, data: IngredienteCreate) -> IngredienteResponse:
    existing = await uow.ingredientes.get_by_nombre(data.nombre)
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un ingrediente con ese nombre")

    ingrediente = Ingrediente(
        codigo=str(uuid4())[:8],
        nombre=data.nombre,
        es_alergeno=data.es_alergeno,
    )
    created = await uow.ingredientes.create(ingrediente)
    return IngredienteResponse.model_validate(created)


async def list_ingredientes(
    uow: UnitOfWork,
    es_alergeno: bool | None,
    page: int,
    limit: int,
) -> IngredienteListResponse:
    skip = (page - 1) * limit
    items = await uow.ingredientes.list_with_filters(es_alergeno, skip, limit)
    total = await uow.ingredientes.count_with_filters(es_alergeno)
    return IngredienteListResponse(
        items=[IngredienteResponse.model_validate(i) for i in items],
        total=total,
        page=page,
        limit=limit,
    )


async def update_ingrediente(
    uow: UnitOfWork,
    ingrediente_id: uuid.UUID,
    data: IngredienteUpdate,
) -> IngredienteResponse:
    ingrediente = await uow.ingredientes.get_by_id_any(ingrediente_id)
    if ingrediente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente no encontrado")

    if data.nombre is not None and data.nombre != ingrediente.nombre:
        conflict = await uow.ingredientes.get_by_nombre(data.nombre)
        if conflict is not None and conflict.id != ingrediente_id:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Ya existe un ingrediente con ese nombre")
        ingrediente.nombre = data.nombre

    if data.es_alergeno is not None:
        ingrediente.es_alergeno = data.es_alergeno

    updated = await uow.ingredientes.update(ingrediente)
    return IngredienteResponse.model_validate(updated)


async def delete_ingrediente(uow: UnitOfWork, ingrediente_id: uuid.UUID) -> None:
    ingrediente = await uow.ingredientes.get_by_id_any(ingrediente_id)
    if ingrediente is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingrediente no encontrado")
    await uow.ingredientes.hard_delete(ingrediente)
