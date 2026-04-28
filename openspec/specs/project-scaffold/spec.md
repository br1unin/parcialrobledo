# project-scaffold Specification

## Purpose
TBD - created by archiving change us-000-setupcontexto. Update Purpose after archive.
## Requirements
### Requirement: Backend feature-first directory structure
El sistema SHALL tener una estructura de carpetas backend organizada por módulo de dominio bajo `app/modules/`, con un núcleo compartido en `app/core/` y la configuración de base de datos en `app/db/`.

Estructura mínima:
```
app/
├── __init__.py
├── main.py                  # FastAPI app, CORS, rate limiting, routers
├── core/
│   ├── __init__.py
│   ├── config.py            # Settings (Pydantic BaseSettings)
│   ├── repository.py        # BaseRepository[T]
│   └── uow.py               # UnitOfWork
├── db/
│   ├── __init__.py
│   └── seed.py              # Script de seed data
└── modules/
    ├── auth/
    │   └── __init__.py
    ├── refreshtokens/
    │   └── __init__.py
    ├── usuarios/
    │   └── __init__.py
    ├── direcciones/
    │   └── __init__.py
    ├── categorias/
    │   └── __init__.py
    ├── productos/
    │   └── __init__.py
    ├── pedidos/
    │   └── __init__.py
    ├── pagos/
    │   └── __init__.py
    └── admin/
        └── __init__.py
```

#### Scenario: Estructura validable en máquina limpia
- **WHEN** el desarrollador clona el repositorio y ejecuta `uvicorn app.main:app --reload`
- **THEN** el servidor arranca sin errores de importación aunque los módulos estén vacíos

#### Scenario: Cada módulo es autocontenido
- **WHEN** se agrega un archivo `model.py` dentro de `app/modules/productos/`
- **THEN** no se requiere modificar ningún archivo fuera de ese módulo ni de `app/main.py`

### Requirement: Frontend Feature-Sliced Design structure
El sistema SHALL tener una estructura de carpetas frontend organizada según FSD con capas `app`, `pages`, `widgets`, `features`, `entities`, `shared` bajo `src/`, con reglas de importación unidireccionales.

Estructura mínima:
```
src/
├── app/
│   ├── App.tsx
│   ├── main.tsx
│   └── router.tsx
├── pages/
│   └── .gitkeep
├── widgets/
│   └── .gitkeep
├── features/
│   └── .gitkeep
├── entities/
│   └── .gitkeep
├── shared/
│   ├── api/
│   │   └── axiosInstance.ts  # Axios base + interceptores JWT
│   ├── ui/
│   │   └── .gitkeep
│   └── types/
│       └── index.ts
└── store/
    ├── authStore.ts
    ├── cartStore.ts
    ├── paymentStore.ts
    └── uiStore.ts
```

#### Scenario: Build de producción sin errores
- **WHEN** el desarrollador ejecuta `npm run build`
- **THEN** Vite compila sin errores de TypeScript y genera el bundle en `dist/`

#### Scenario: Dev server arranca correctamente
- **WHEN** el desarrollador ejecuta `npm run dev`
- **THEN** el servidor de desarrollo de Vite está disponible en `http://localhost:5173`

### Requirement: Archivos de configuración de herramientas
El proyecto SHALL incluir los archivos de configuración necesarios para operar el stack completo.

Backend: `requirements.txt`, `alembic.ini`, `.env.example`, `pyproject.toml` (opcional)  
Frontend: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `tailwind.config.ts`, `postcss.config.js`, `index.html`

#### Scenario: Instalación de dependencias backend
- **WHEN** el desarrollador ejecuta `pip install -r requirements.txt`
- **THEN** todas las dependencias se instalan sin conflictos de versión

#### Scenario: Instalación de dependencias frontend
- **WHEN** el desarrollador ejecuta `npm install`
- **THEN** `node_modules` se crea sin errores ni peer dependency warnings críticos

