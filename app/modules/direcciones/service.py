import uuid
from datetime import datetime

from fastapi import HTTPException

from app.modules.direcciones.model import DireccionEntrega
from app.modules.direcciones.schemas import DireccionCreate, DireccionResponse, DireccionUpdate


async def create_direccion(uow, usuario_id: uuid.UUID, data: DireccionCreate) -> DireccionResponse:
    count = await uow.direcciones.count_activas(usuario_id)
    es_principal = count == 0
    direccion = DireccionEntrega(
        usuario_id=usuario_id,
        calle=data.calle,
        numero=data.numero,
        departamento=data.departamento,
        comuna=data.comuna,
        ciudad=data.ciudad,
        codigo_postal=data.codigo_postal,
        es_principal=es_principal,
    )
    created = await uow.direcciones.create(direccion)
    return DireccionResponse.model_validate(created)


async def list_direcciones(uow, usuario_id: uuid.UUID) -> list[DireccionResponse]:
    items = await uow.direcciones.list_by_usuario(usuario_id)
    return [DireccionResponse.model_validate(d) for d in items]


async def update_direccion(uow, id: uuid.UUID, usuario_id: uuid.UUID, data: DireccionUpdate) -> DireccionResponse:
    direccion = await uow.direcciones.get_own(id, usuario_id)
    if direccion is None:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
    if data.calle is not None:
        direccion.calle = data.calle
    if data.numero is not None:
        direccion.numero = data.numero
    if data.departamento is not None:
        direccion.departamento = data.departamento
    if data.comuna is not None:
        direccion.comuna = data.comuna
    if data.ciudad is not None:
        direccion.ciudad = data.ciudad
    if data.codigo_postal is not None:
        direccion.codigo_postal = data.codigo_postal
    direccion.updated_at = datetime.utcnow()
    updated = await uow.direcciones.update(direccion)
    return DireccionResponse.model_validate(updated)


async def delete_direccion(uow, id: uuid.UUID, usuario_id: uuid.UUID) -> None:
    direccion = await uow.direcciones.get_own(id, usuario_id)
    if direccion is None:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
    was_principal = direccion.es_principal
    await uow.direcciones.soft_delete(direccion)
    if was_principal:
        oldest = await uow.direcciones.get_oldest_activa(usuario_id, exclude_id=id)
        if oldest is not None:
            await uow.direcciones.set_principal(oldest.id)


async def set_predeterminada(uow, id: uuid.UUID, usuario_id: uuid.UUID) -> DireccionResponse:
    direccion = await uow.direcciones.get_own(id, usuario_id)
    if direccion is None:
        raise HTTPException(status_code=404, detail="Dirección no encontrada")
    await uow.direcciones.unset_all_principal(usuario_id)
    await uow.direcciones.set_principal(id)
    updated = await uow.direcciones.get_own(id, usuario_id)
    return DireccionResponse.model_validate(updated)
