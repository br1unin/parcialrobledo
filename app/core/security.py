import asyncio
import hashlib
import uuid
from datetime import datetime, timedelta, timezone
from functools import partial

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from pydantic import BaseModel

from app.core.config import settings
from app.core.uow import UnitOfWork, get_uow

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


class CurrentUser(BaseModel):
    id: uuid.UUID
    email: str
    nombre: str
    apellido: str
    roles: list[str]


async def hash_password(plain: str) -> str:
    loop = asyncio.get_event_loop()
    hashed = await loop.run_in_executor(
        None, partial(bcrypt.hashpw, plain.encode(), bcrypt.gensalt(rounds=12))
    )
    return hashed.decode()


async def verify_password(plain: str, hashed: str) -> bool:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        None, partial(bcrypt.checkpw, plain.encode(), hashed.encode())
    )


def create_access_token(subject: str, roles: list[str]) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    payload = {"sub": subject, "roles": roles, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def hash_token(raw_token: str) -> str:
    """SHA-256 hash of a raw refresh token for deterministic DB lookup."""
    return hashlib.sha256(raw_token.encode()).hexdigest()


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    uow: UnitOfWork = Depends(get_uow),
) -> CurrentUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No autenticado",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str | None = payload.get("sub")
        roles: list[str] = payload.get("roles", [])
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    from app.modules.usuarios.repository import UsuarioRepository

    repo = UsuarioRepository(uow.session)
    user = await repo.get_by_id(uuid.UUID(user_id))
    if user is None or not user.is_active:
        raise credentials_exception

    return CurrentUser(
        id=user.id,
        email=user.email,
        nombre=user.nombre,
        apellido=user.apellido,
        roles=roles,
    )


def require_role(roles: list[str]):
    async def _check(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if not any(r in roles for r in current_user.roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permisos insuficientes",
            )
        return current_user

    return _check
