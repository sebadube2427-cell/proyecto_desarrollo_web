from bson import ObjectId
from fastapi import (
    FastAPI,
    Header,
    Depends,
    HTTPException)
import json
import os
import hvac
from pydantic import BaseModel, Field
from database import get_colection, get_db

app = FastAPI(title="admin API")


class Product(BaseModel):
    nombre: str
    precio: float = Field(gt=0)
    categoria: str
    disponible: bool = True
    masvendido: bool = False
    imagen: str = ""


@app.post("/products", status_code=201)
async def post_product(product: Product):
    db = get_db()
    coleccion = get_colection(db, "products")

    resultado = await coleccion.insert_one(
        product.model_dump()
    )

    return {
        "mensaje": "Producto creado correctamente",
        "id": str(resultado.inserted_id)
    }


@app.get('/orders')
async def get_orders():
    db = get_db()
    colection = get_colection(db, 'orders')
    orders = await colection.find().to_list(length=100)
    for order in orders:
        order['_id'] = str(order['_id'])
    return orders


class ProductUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    precio: float | None = Field(default=None, gt=0)
    categoria: str | None = None
    disponible: bool | None = None
    masvendido: bool | None = None
    imagen: str | None = None


@app.patch("/products/{producto_id}")
async def update_product(producto_id: str, cambios: ProductUpdate):
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
