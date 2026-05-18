"""Seed de categorías, ingredientes y productos para FoodStore."""
import asyncio
import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlmodel import select

from app.core.config import settings
from app.modules.categorias.model import Categoria
from app.modules.productos.model import Ingrediente, Producto, ProductoCategoria, ProductoIngrediente

engine = create_async_engine(settings.DATABASE_URL, future=True)
AsyncSessionLocal = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)


async def get_or_create_categoria(session: AsyncSession, nombre: str, descripcion: str = None, padre_id=None) -> Categoria:
    result = await session.execute(select(Categoria).where(Categoria.nombre == nombre))
    cat = result.scalar_one_or_none()
    if not cat:
        cat = Categoria(id=uuid.uuid4(), nombre=nombre, descripcion=descripcion, padre_id=padre_id)
        session.add(cat)
        await session.flush()
    return cat


async def get_or_create_ingrediente(session: AsyncSession, codigo: str, nombre: str, es_alergeno: bool = False) -> Ingrediente:
    result = await session.execute(select(Ingrediente).where(Ingrediente.codigo == codigo))
    ing = result.scalar_one_or_none()
    if not ing:
        ing = Ingrediente(id=uuid.uuid4(), codigo=codigo, nombre=nombre, es_alergeno=es_alergeno)
        session.add(ing)
        await session.flush()
    return ing


async def get_or_create_producto(session: AsyncSession, **kwargs) -> Producto:
    result = await session.execute(select(Producto).where(Producto.codigo == kwargs["codigo"]))
    prod = result.scalar_one_or_none()
    if not prod:
        prod = Producto(id=uuid.uuid4(), **kwargs)
        session.add(prod)
        await session.flush()
    return prod


async def link_producto_categoria(session: AsyncSession, producto_id, categoria_id):
    result = await session.execute(
        select(ProductoCategoria).where(
            ProductoCategoria.producto_id == producto_id,
            ProductoCategoria.categoria_id == categoria_id,
        )
    )
    if not result.scalar_one_or_none():
        session.add(ProductoCategoria(producto_id=producto_id, categoria_id=categoria_id))


async def link_producto_ingrediente(session: AsyncSession, producto_id, ingrediente_id, es_removible: bool = True):
    result = await session.execute(
        select(ProductoIngrediente).where(
            ProductoIngrediente.producto_id == producto_id,
            ProductoIngrediente.ingrediente_id == ingrediente_id,
        )
    )
    if not result.scalar_one_or_none():
        session.add(ProductoIngrediente(producto_id=producto_id, ingrediente_id=ingrediente_id, es_removible=es_removible))


async def seed():
    async with AsyncSessionLocal() as session:
        async with session.begin():

            # ── Categorías padre ──────────────────────────────────────────────
            hamburguesas = await get_or_create_categoria(session, "Hamburguesas", "Hamburguesas artesanales")
            pizzas       = await get_or_create_categoria(session, "Pizzas",       "Pizzas al horno de piedra")
            empanadas    = await get_or_create_categoria(session, "Empanadas",    "Empanadas caseras")
            bebidas      = await get_or_create_categoria(session, "Bebidas",      "Bebidas frías y calientes")
            postres      = await get_or_create_categoria(session, "Postres",      "Postres y dulces")

            # Subcategorías
            burg_clasicas  = await get_or_create_categoria(session, "Hamburguesas Clásicas",  padre_id=hamburguesas.id)
            burg_especiales= await get_or_create_categoria(session, "Hamburguesas Especiales",padre_id=hamburguesas.id)
            piz_clasicas   = await get_or_create_categoria(session, "Pizzas Clásicas",        padre_id=pizzas.id)
            piz_especiales = await get_or_create_categoria(session, "Pizzas Especiales",      padre_id=pizzas.id)
            beb_sin_alcohol= await get_or_create_categoria(session, "Sin Alcohol",            padre_id=bebidas.id)
            beb_jugos      = await get_or_create_categoria(session, "Jugos Naturales",        padre_id=bebidas.id)

            # ── Ingredientes ──────────────────────────────────────────────────
            pan         = await get_or_create_ingrediente(session, "PAN_BRIOCHE",   "Pan brioche",          es_alergeno=True)
            carne       = await get_or_create_ingrediente(session, "CARNE_RES",     "Medallón de res 180g", es_alergeno=False)
            queso_chedd = await get_or_create_ingrediente(session, "QUESO_CHEDDAR", "Queso cheddar",        es_alergeno=True)
            queso_muzz  = await get_or_create_ingrediente(session, "QUESO_MUZZ",    "Mozzarella",           es_alergeno=True)
            lechuga     = await get_or_create_ingrediente(session, "LECHUGA",       "Lechuga",              es_alergeno=False)
            tomate      = await get_or_create_ingrediente(session, "TOMATE",        "Tomate",               es_alergeno=False)
            cebolla     = await get_or_create_ingrediente(session, "CEBOLLA",       "Cebolla",              es_alergeno=False)
            pepino      = await get_or_create_ingrediente(session, "PEPINO",        "Pepino",               es_alergeno=False)
            bacon       = await get_or_create_ingrediente(session, "BACON",         "Bacon ahumado",        es_alergeno=False)
            huevo       = await get_or_create_ingrediente(session, "HUEVO",         "Huevo frito",          es_alergeno=True)
            salsa_bbq   = await get_or_create_ingrediente(session, "SALSA_BBQ",     "Salsa BBQ",            es_alergeno=False)
            salsa_mayo  = await get_or_create_ingrediente(session, "SALSA_MAYO",    "Mayonesa",             es_alergeno=True)
            salsa_tomate= await get_or_create_ingrediente(session, "SALSA_TOMATE",  "Salsa de tomate",      es_alergeno=False)
            pimiento    = await get_or_create_ingrediente(session, "PIMIENTO",      "Pimiento rojo",        es_alergeno=False)
            jamon       = await get_or_create_ingrediente(session, "JAMON",         "Jamón cocido",         es_alergeno=False)
            champignon  = await get_or_create_ingrediente(session, "CHAMPIGNON",    "Champiñones",          es_alergeno=False)
            rúcula      = await get_or_create_ingrediente(session, "RUCULA",        "Rúcula",               es_alergeno=False)
            masa_pizza  = await get_or_create_ingrediente(session, "MASA_PIZZA",    "Masa pizza artesanal", es_alergeno=True)
            masa_emp    = await get_or_create_ingrediente(session, "MASA_EMP",      "Masa de empanada",     es_alergeno=True)
            pollo       = await get_or_create_ingrediente(session, "POLLO",         "Pollo desmenuzado",    es_alergeno=False)
            maiz        = await get_or_create_ingrediente(session, "MAIZ",          "Choclo",               es_alergeno=False)
            aceitunas   = await get_or_create_ingrediente(session, "ACEITUNAS",     "Aceitunas negras",     es_alergeno=False)
            cebolla_cara= await get_or_create_ingrediente(session, "CEBOLLA_CARA",  "Cebolla caramelizada", es_alergeno=False)

            # ── Productos ─────────────────────────────────────────────────────

            # Hamburguesas clásicas
            p_clasica = await get_or_create_producto(session,
                codigo="BURG-001", nombre="Clásica", precio=Decimal("1200.00"), stock_cantidad=50,
                descripcion="Medallón de res, lechuga, tomate, cebolla y mayonesa",
            )
            p_doble = await get_or_create_producto(session,
                codigo="BURG-002", nombre="Doble Clásica", precio=Decimal("1800.00"), stock_cantidad=40,
                descripcion="Doble medallón de res, queso cheddar, lechuga y tomate",
            )
            p_veggie = await get_or_create_producto(session,
                codigo="BURG-003", nombre="Veggie", precio=Decimal("1100.00"), stock_cantidad=30,
                descripcion="Medallón de garbanzos, lechuga, tomate, pepino y mayonesa",
            )

            # Hamburguesas especiales
            p_bbq = await get_or_create_producto(session,
                codigo="BURG-004", nombre="BBQ Bacon", precio=Decimal("1600.00"), stock_cantidad=45,
                descripcion="Medallón de res, bacon crocante, queso cheddar y salsa BBQ",
            )
            p_egg = await get_or_create_producto(session,
                codigo="BURG-005", nombre="Egg Burger", precio=Decimal("1500.00"), stock_cantidad=35,
                descripcion="Medallón de res, huevo frito, queso cheddar y cebolla caramelizada",
            )
            p_gourmet = await get_or_create_producto(session,
                codigo="BURG-006", nombre="Gourmet Rúcula", precio=Decimal("1900.00"), stock_cantidad=25,
                descripcion="Medallón de res, rúcula, queso mozzarella y cebolla caramelizada",
            )

            # Pizzas clásicas
            p_marg = await get_or_create_producto(session,
                codigo="PIZ-001", nombre="Margherita", precio=Decimal("1400.00"), stock_cantidad=20,
                descripcion="Salsa de tomate, mozzarella y albahaca",
            )
            p_napol = await get_or_create_producto(session,
                codigo="PIZ-002", nombre="Napolitana", precio=Decimal("1500.00"), stock_cantidad=20,
                descripcion="Salsa de tomate, mozzarella, tomate fresco y orégano",
            )
            p_jamon_q = await get_or_create_producto(session,
                codigo="PIZ-003", nombre="Jamón y Queso", precio=Decimal("1600.00"), stock_cantidad=20,
                descripcion="Salsa de tomate, mozzarella y jamón",
            )

            # Pizzas especiales
            p_cuatro_q = await get_or_create_producto(session,
                codigo="PIZ-004", nombre="Cuatro Quesos", precio=Decimal("1900.00"), stock_cantidad=15,
                descripcion="Mozzarella, cheddar, brie y parmesano",
            )
            p_champ = await get_or_create_producto(session,
                codigo="PIZ-005", nombre="Champiñones & Rúcula", precio=Decimal("1800.00"), stock_cantidad=15,
                descripcion="Base de crema, champiñones salteados, rúcula y mozzarella",
            )
            p_bbo_pollo = await get_or_create_producto(session,
                codigo="PIZ-006", nombre="BBQ Pollo", precio=Decimal("1950.00"), stock_cantidad=15,
                descripcion="Salsa BBQ, pollo desmenuzado, cebolla y mozzarella",
            )

            # Empanadas
            p_emp_carne = await get_or_create_producto(session,
                codigo="EMP-001", nombre="Empanada de Carne", precio=Decimal("350.00"), stock_cantidad=80,
                descripcion="Relleno de carne picada con cebolla, pimiento y huevo duro",
            )
            p_emp_pollo = await get_or_create_producto(session,
                codigo="EMP-002", nombre="Empanada de Pollo", precio=Decimal("350.00"), stock_cantidad=80,
                descripcion="Relleno de pollo con choclo y salsa blanca",
            )
            p_emp_jyq = await get_or_create_producto(session,
                codigo="EMP-003", nombre="Empanada Jamón y Queso", precio=Decimal("320.00"), stock_cantidad=80,
                descripcion="Relleno de jamón cocido y mozzarella",
            )
            p_emp_caprese = await get_or_create_producto(session,
                codigo="EMP-004", nombre="Empanada Caprese", precio=Decimal("330.00"), stock_cantidad=60,
                descripcion="Relleno de tomate, mozzarella y rúcula",
            )

            # Bebidas sin alcohol
            p_coca = await get_or_create_producto(session,
                codigo="BEB-001", nombre="Coca-Cola 500ml", precio=Decimal("600.00"), stock_cantidad=100,
                descripcion="Coca-Cola 500ml en botella",
            )
            p_agua = await get_or_create_producto(session,
                codigo="BEB-002", nombre="Agua mineral 500ml", precio=Decimal("400.00"), stock_cantidad=100,
                descripcion="Agua mineral sin gas",
            )
            p_sprite = await get_or_create_producto(session,
                codigo="BEB-003", nombre="Sprite 500ml", precio=Decimal("600.00"), stock_cantidad=80,
                descripcion="Sprite 500ml en botella",
            )

            # Jugos naturales
            p_jugo_nar = await get_or_create_producto(session,
                codigo="BEB-004", nombre="Jugo de Naranja", precio=Decimal("700.00"), stock_cantidad=40,
                descripcion="Jugo de naranja natural exprimido 400ml",
            )
            p_jugo_lim = await get_or_create_producto(session,
                codigo="BEB-005", nombre="Limonada", precio=Decimal("650.00"), stock_cantidad=40,
                descripcion="Limonada natural con menta 400ml",
            )

            # Postres
            p_cheesecake = await get_or_create_producto(session,
                codigo="POS-001", nombre="Cheesecake de Frutos Rojos", precio=Decimal("900.00"), stock_cantidad=20,
                descripcion="Cheesecake cremoso con salsa de frutos rojos",
            )
            p_brownie = await get_or_create_producto(session,
                codigo="POS-002", nombre="Brownie con Helado", precio=Decimal("850.00"), stock_cantidad=20,
                descripcion="Brownie de chocolate tibio con helado de vainilla",
            )
            p_tiramisu = await get_or_create_producto(session,
                codigo="POS-003", nombre="Tiramisú", precio=Decimal("950.00"), stock_cantidad=15,
                descripcion="Tiramisú clásico con mascarpone y café",
            )

            # ── Links producto → categoría ────────────────────────────────────
            for prod, cats in [
                (p_clasica,   [hamburguesas.id, burg_clasicas.id]),
                (p_doble,     [hamburguesas.id, burg_clasicas.id]),
                (p_veggie,    [hamburguesas.id, burg_clasicas.id]),
                (p_bbq,       [hamburguesas.id, burg_especiales.id]),
                (p_egg,       [hamburguesas.id, burg_especiales.id]),
                (p_gourmet,   [hamburguesas.id, burg_especiales.id]),
                (p_marg,      [pizzas.id, piz_clasicas.id]),
                (p_napol,     [pizzas.id, piz_clasicas.id]),
                (p_jamon_q,   [pizzas.id, piz_clasicas.id]),
                (p_cuatro_q,  [pizzas.id, piz_especiales.id]),
                (p_champ,     [pizzas.id, piz_especiales.id]),
                (p_bbo_pollo, [pizzas.id, piz_especiales.id]),
                (p_emp_carne,   [empanadas.id]),
                (p_emp_pollo,   [empanadas.id]),
                (p_emp_jyq,     [empanadas.id]),
                (p_emp_caprese, [empanadas.id]),
                (p_coca,    [bebidas.id, beb_sin_alcohol.id]),
                (p_agua,    [bebidas.id, beb_sin_alcohol.id]),
                (p_sprite,  [bebidas.id, beb_sin_alcohol.id]),
                (p_jugo_nar,[bebidas.id, beb_jugos.id]),
                (p_jugo_lim,[bebidas.id, beb_jugos.id]),
                (p_cheesecake,[postres.id]),
                (p_brownie,   [postres.id]),
                (p_tiramisu,  [postres.id]),
            ]:
                for cat_id in cats:
                    await link_producto_categoria(session, prod.id, cat_id)

            # ── Links producto → ingrediente ──────────────────────────────────
            burg_base = [(carne, False), (pan, False), (lechuga, True), (tomate, True), (salsa_mayo, True)]
            for ing, removible in burg_base:
                await link_producto_ingrediente(session, p_clasica.id, ing.id, removible)
            await link_producto_ingrediente(session, p_clasica.id, cebolla.id, True)

            for ing, removible in burg_base:
                await link_producto_ingrediente(session, p_doble.id, ing.id, removible)
            await link_producto_ingrediente(session, p_doble.id, queso_chedd.id, True)

            for ing_id in [pan.id, lechuga.id, tomate.id, pepino.id, salsa_mayo.id]:
                await link_producto_ingrediente(session, p_veggie.id, ing_id, True)

            for ing_id in [carne.id, pan.id, bacon.id, queso_chedd.id, salsa_bbq.id]:
                await link_producto_ingrediente(session, p_bbq.id, ing_id, True if ing_id != carne.id else False)

            for ing_id in [carne.id, pan.id, huevo.id, queso_chedd.id, cebolla_cara.id]:
                await link_producto_ingrediente(session, p_egg.id, ing_id, True if ing_id != carne.id else False)

            for ing_id in [carne.id, pan.id, rúcula.id, queso_muzz.id, cebolla_cara.id]:
                await link_producto_ingrediente(session, p_gourmet.id, ing_id, True if ing_id != carne.id else False)

            for ing_id in [masa_pizza.id, salsa_tomate.id, queso_muzz.id]:
                await link_producto_ingrediente(session, p_marg.id, ing_id, False)

            for ing_id in [masa_pizza.id, salsa_tomate.id, queso_muzz.id, tomate.id]:
                await link_producto_ingrediente(session, p_napol.id, ing_id, True if ing_id == tomate.id else False)

            for ing_id in [masa_pizza.id, salsa_tomate.id, queso_muzz.id, jamon.id]:
                await link_producto_ingrediente(session, p_jamon_q.id, ing_id, True if ing_id == jamon.id else False)

            for ing_id in [masa_pizza.id, queso_muzz.id, queso_chedd.id]:
                await link_producto_ingrediente(session, p_cuatro_q.id, ing_id, False)

            for ing_id in [masa_pizza.id, queso_muzz.id, champignon.id, rúcula.id]:
                await link_producto_ingrediente(session, p_champ.id, ing_id, True if ing_id in (champignon.id, rúcula.id) else False)

            for ing_id in [masa_pizza.id, salsa_bbq.id, pollo.id, queso_muzz.id, cebolla.id]:
                await link_producto_ingrediente(session, p_bbo_pollo.id, ing_id, True if ing_id != masa_pizza.id else False)

            for ing_id in [masa_emp.id, carne.id, cebolla.id, pimiento.id, huevo.id]:
                await link_producto_ingrediente(session, p_emp_carne.id, ing_id, False)

            for ing_id in [masa_emp.id, pollo.id, maiz.id]:
                await link_producto_ingrediente(session, p_emp_pollo.id, ing_id, False)

            for ing_id in [masa_emp.id, jamon.id, queso_muzz.id]:
                await link_producto_ingrediente(session, p_emp_jyq.id, ing_id, False)

            for ing_id in [masa_emp.id, tomate.id, queso_muzz.id, rúcula.id]:
                await link_producto_ingrediente(session, p_emp_caprese.id, ing_id, False)

    await engine.dispose()
    print("Seed de productos completo.")
    print("  Categorías: Hamburguesas, Pizzas, Empanadas, Bebidas, Postres (+ subcategorías)")
    print("  Ingredientes: 23")
    print("  Productos: 24 (6 burgers, 6 pizzas, 4 empanadas, 5 bebidas, 3 postres)")


if __name__ == "__main__":
    asyncio.run(seed())
