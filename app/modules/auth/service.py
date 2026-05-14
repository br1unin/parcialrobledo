import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status

from app.core.config import settings
from app.core.security import create_access_token, hash_password, hash_token, verify_password
from app.core.uow import UnitOfWork
from app.modules.auth.schemas import LoginRequest, RegisterRequest
from app.modules.refreshtokens.model import RefreshToken
from app.modules.usuarios.model import Usuario
from app.modules.usuarios.schemas import TokenResponse, UserResponse

# Dummy bcrypt hash used to normalize timing when email is not found (prevents user enumeration)
_DUMMY_HASH = "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW"


async def _issue_tokens(uow: UnitOfWork, user: Usuario) -> TokenResponse:
    roles = await uow.usuarios.get_roles(user.id)
    access_token = create_access_token(str(user.id), roles)
    raw_refresh = str(uuid.uuid4())
    rt = RefreshToken(
        usuario_id=user.id,
        token_hash=hash_token(raw_refresh),
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    await uow.refresh_tokens.create(rt)
    return TokenResponse(
        access_token=access_token,
        refresh_token=raw_refresh,
        user=UserResponse(
            id=user.id,
            email=user.email,
            nombre=user.nombre,
            apellido=user.apellido,
            roles=roles,
        ),
    )


async def register(uow: UnitOfWork, data: RegisterRequest) -> TokenResponse:
    if await uow.usuarios.get_by_email(data.email):
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="El email ya está registrado")

    hashed = await hash_password(data.password)
    user = await uow.usuarios.create(
        Usuario(nombre=data.nombre, apellido=data.apellido, email=data.email, password_hash=hashed)
    )
    await uow.usuarios.assign_role(user.id, "CLIENT")
    return await _issue_tokens(uow, user)


async def login(uow: UnitOfWork, data: LoginRequest) -> TokenResponse:
    user = await uow.usuarios.get_by_email(data.email)

    if user is None or not user.is_active:
        await verify_password(data.password, _DUMMY_HASH)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    if not await verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciales inválidas")

    return await _issue_tokens(uow, user)


async def refresh_tokens(uow: UnitOfWork, raw_token: str) -> TokenResponse:
    token_hash = hash_token(raw_token)
    stored = await uow.refresh_tokens.get_by_token_hash(token_hash)

    if stored is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    if stored.revoked_at is not None:
        await uow.refresh_tokens.revoke_all_for_user(stored.usuario_id)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    expires = stored.expires_at
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expirado")

    await uow.refresh_tokens.revoke_token(stored.id)

    user = await uow.usuarios.get_by_id(stored.usuario_id)
    if user is None or not user.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    return await _issue_tokens(uow, user)


async def logout(uow: UnitOfWork, raw_token: str) -> None:
    token_hash = hash_token(raw_token)
    stored = await uow.refresh_tokens.get_by_token_hash(token_hash)
    if stored and stored.revoked_at is None:
        await uow.refresh_tokens.revoke_token(stored.id)
