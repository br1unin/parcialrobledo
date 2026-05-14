from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.rate_limit import limiter

# Register all SQLModel models so FK resolution works at startup
import app.modules.admin.model  # noqa: F401
import app.modules.categorias.model  # noqa: F401
import app.modules.direcciones.model  # noqa: F401
import app.modules.pagos.model  # noqa: F401
import app.modules.pedidos.model  # noqa: F401
import app.modules.productos.model  # noqa: F401
import app.modules.refreshtokens.model  # noqa: F401
import app.modules.usuarios.model  # noqa: F401

app = FastAPI(title="Food Store API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from app.modules.admin.router import router as admin_router  # noqa: E402
from app.modules.auth.router import router as auth_router  # noqa: E402
from app.modules.categorias.router import router as categorias_router  # noqa: E402
from app.modules.direcciones.router import router as direcciones_router  # noqa: E402
from app.modules.ingredientes.router import router as ingredientes_router  # noqa: E402
from app.modules.pagos.router import router as pagos_router  # noqa: E402
from app.modules.pedidos.router import router as pedidos_router  # noqa: E402
from app.modules.productos.router import router as productos_router  # noqa: E402
from app.modules.usuarios.router import router as usuarios_router  # noqa: E402

app.include_router(admin_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(categorias_router, prefix="/api/v1/categorias", tags=["categorias"])
app.include_router(direcciones_router, prefix="/api/v1/direcciones", tags=["direcciones"])
app.include_router(ingredientes_router, prefix="/api/v1/ingredientes", tags=["ingredientes"])
app.include_router(pagos_router, prefix="/api/v1/pagos", tags=["pagos"])
app.include_router(pedidos_router, prefix="/api/v1/pedidos", tags=["pedidos"])
app.include_router(productos_router, prefix="/api/v1/productos", tags=["productos"])
app.include_router(usuarios_router, prefix="/api/v1/usuarios", tags=["usuarios"])
