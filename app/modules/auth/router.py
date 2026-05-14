from fastapi import APIRouter, Depends, Request, status

from app.core.rate_limit import limiter
from app.core.uow import UnitOfWork, get_uow
from app.modules.auth import service
from app.modules.auth.schemas import LoginRequest, LogoutRequest, RefreshRequest, RegisterRequest
from app.modules.usuarios.schemas import TokenResponse

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, uow: UnitOfWork = Depends(get_uow)):
    return await service.register(uow, data)


@router.post("/login", response_model=TokenResponse)
@limiter.limit("5/15minutes")
async def login(request: Request, data: LoginRequest, uow: UnitOfWork = Depends(get_uow)):
    return await service.login(uow, data)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, uow: UnitOfWork = Depends(get_uow)):
    return await service.refresh_tokens(uow, data.refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(data: LogoutRequest, uow: UnitOfWork = Depends(get_uow)):
    await service.logout(uow, data.refresh_token)
