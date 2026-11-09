from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from bson import ObjectId
from fastapi import (
    FastAPI,
    Header,
    HTTPException,
    Request
)
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from database import get_colection, get_db
from typing import Literal
import secrets

from vault_client import obtener_secreto


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Cargar el secreto desde Vault al iniciar Admin
    app.state.internal_secret = obtener_secreto("INTERNAL_SECRET")

    print("Secreto interno cargado correctamente desde Vault.")

    yield


app = FastAPI(
    title="Admin API",
    lifespan=lifespan
)


@app.middleware("http")
async def verificar_gateway(request: Request, call_next):

    # Permitir documentación durante el desarrollo
    rutas_publicas = ["/docs", "/redoc", "/openapi.json"]

    if request.url.path in rutas_publicas:
        return await call_next(request)

    secreto_recibido = request.headers.get("X-Internal-Secret")
    secreto_correcto = request.app.state.internal_secret

    if (
        not secreto_recibido
        or not secrets.compare_digest(
            secreto_recibido,
            secreto_correcto
        )
    ):
        return JSONResponse(
            status_code=403,
            content={"detail": "Acceso no autorizado"}
        )

    return await call_next(request)


def convertir_objectid(documento):
    if isinstance(documento, ObjectId):
        return str(documento)

    if isinstance(documento, dict):
        return {
            clave: convertir_objectid(valor)
            for clave, valor in documento.items()
        }

    if isinstance(documento, list):
        return [convertir_objectid(elemento) for elemento in documento]

    return documento


class Product(BaseModel):
    nombre: str
    precio: float = Field(gt=0)
    categoria: str
    disponible: bool = True
    masvendido: bool = False
    imagen: str = ""


@app.get('/admin/orders')
async def get_orders(
    user_id: str = Header(alias="X-User-ID")
):
    db = get_db()
    collection = get_colection(db, 'orders')

    orders = await collection.find().sort(
        "fecha", -1
    ).limit(50).to_list(length=50)

    for order in orders:
        order['_id'] = str(order['_id'])
        order['cliente_id'] = str(order['cliente_id'])

    return orders


class ProductUpdate(BaseModel):
    precio: float | None = Field(default=None, gt=0)
    disponible: bool | None = None


@app.patch("/admin/products/{producto_id}")
async def update_product(
    producto_id: str,
    cambios: ProductUpdate
):
    if not ObjectId.is_valid(producto_id):
        raise HTTPException(
            status_code=400,
            detail="ID de producto inválido"
        )

    db = get_db()
    coleccion = get_colection(db, "products")

    cambios_producto = cambios.model_dump(exclude_unset=True)

    if not cambios_producto:
        raise HTTPException(
            status_code=400,
            detail="No se enviaron campos para actualizar"
        )

    resultado = await coleccion.update_one(
        {"_id": ObjectId(producto_id)},
        {"$set": cambios_producto}
    )

    if resultado.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Producto no encontrado"
        )

    return {
        "mensaje": "Producto actualizado correctamente",
        "campos_actualizados": list(cambios_producto.keys())
    }


@app.get('/admin/solicitudes')
async def get_solicitudes(
    user_id: str = Header(alias="X-User-ID")
):
    db = get_db()
    collection = get_colection(db, 'solicitudes')

    solicitudes = await collection.find(
        {"estado": "pendiente"}
    ).sort(
        "fecha_creacion", -1
    ).limit(25).to_list(length=25)

    return convertir_objectid(solicitudes)


@app.get('/admin/ganancias')
async def get_ganancias(
    user_id: str = Header(alias="X-User-ID")
):
    db = get_db()
    collection = get_colection(db, 'orders')

    fecha_inicio = datetime.now(timezone.utc) - timedelta(days=30)

    cursor = await collection.aggregate([
        {
            "$match": {
                "estado": "pagado",
                "fecha": {"$gte": fecha_inicio}
            }
        },
        {
            "$group": {
                "_id": None,
                "ganancias": {"$sum": "$total"},
                "cantidad_pedidos": {"$sum": 1}
            }
        }
    ])

    resultado = await cursor.to_list(length=1)

    if not resultado:
        return {
            "ganancias": 0,
            "cantidad_pedidos": 0,
            "periodo_dias": 30
        }

    return {
        "ganancias": resultado[0]["ganancias"],
        "cantidad_pedidos": resultado[0]["cantidad_pedidos"],
        "periodo_dias": 30
    }


class OrderUpdate(BaseModel):
    estado: Literal["pagado"]


@app.patch("/admin/orders/{pedido_id}")
async def update_order(
    pedido_id: str,
    cambios: OrderUpdate,
    user_id: str = Header(alias="X-User-ID")
):
    # Validar ID
    if not ObjectId.is_valid(pedido_id):
        raise HTTPException(
            status_code=400,
            detail="ID de pedido inválido"
        )

    db = get_db()
    coleccion = get_colection(db, "orders")

    # Buscar el pedido y comprobar su estado actual
    pedido = await coleccion.find_one({
        "_id": ObjectId(pedido_id)
    })

    if pedido is None:
        raise HTTPException(
            status_code=404,
            detail="Pedido no encontrado"
        )

    if pedido["estado"] != "pendiente":
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden confirmar pedidos pendientes de pago"
        )

    # Actualizar estado
    cambios_pedido = cambios.model_dump(exclude_unset=True)

    resultado = await coleccion.update_one(
        {
            "_id": ObjectId(pedido_id),
            "estado": "pendiente"
        },
        {
            "$set": cambios_pedido
        }
    )

    if resultado.modified_count == 0:
        raise HTTPException(
            status_code=409,
            detail="El pedido ya fue actualizado"
        )

    return {
        "mensaje": "Pago confirmado correctamente",
        "pedido_id": pedido_id,
        "estado": "pagado"
    }
