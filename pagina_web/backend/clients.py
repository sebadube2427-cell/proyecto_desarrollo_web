from datetime import datetime, timezone, date
from typing import List
from pydantic import BaseModel, Field, EmailStr
from fastapi import (
    FastAPI,
    Header,
    Depends,
    HTTPException)
from pymongo.errors import DuplicateKeyError
from pwdlib import PasswordHash
import json
from bson import ObjectId
import os
import hvac
from database import get_colection, get_db

# fastapi
app = FastAPI(title="Clients API")


@app.get("/products")
async def get_products():
    db = get_db()
    coleccion = get_colection(db, "products")

    productos = await coleccion.find().to_list(length=100)

    for producto in productos:
        producto["_id"] = str(producto["_id"])

    return productos


async def calcular_total(productos_pedido, coleccion_productos):
    total = 0

    for item in productos_pedido:
        if not ObjectId.is_valid(item.producto_id):
            raise HTTPException(
                status_code=400,
                detail=f"ID de producto inválido: {item.producto_id}"
            )

        producto = await coleccion_productos.find_one({
            "_id": ObjectId(item.producto_id)
        })

        if producto is None:
            raise HTTPException(
                status_code=404,
                detail=f"Producto {item.producto_id} no encontrado"
            )

        if not producto.get("disponible", True):
            raise HTTPException(
                status_code=400,
                detail=f"Producto no disponible: {producto.get('nombre', item.producto_id)}"
            )

        cantidad = item.cantidad
        total += producto["precio"] * cantidad

    return total


class ProductoPedido(BaseModel):
    producto_id: str
    cantidad: int = Field(gt=0)


class Order(BaseModel):
    cliente_id: str
    productos: List[ProductoPedido] = Field(min_length=1)
    observacion: str = ""
    direccion: str | None = None


@app.post("/orders", status_code=201)
async def post_order(order: Order):
    db = get_db()

    coleccion_pedidos = get_colection(db, "orders")
    coleccion_productos = get_colection(db, "products")

    total = await calcular_total(
        order.productos,
        coleccion_productos
    )

    nuevo_order = order.model_dump()

    nuevo_order["productos"] = [
        {
            "producto_id": item.producto_id,
            "cantidad": item.cantidad
        }
        for item in order.productos
    ]

    nuevo_order["total"] = total
    nuevo_order["estado"] = "pendiente"
    nuevo_order["fecha"] = datetime.now(timezone.utc)

    resultado = await coleccion_pedidos.insert_one(nuevo_order)

    return {
        "mensaje": "Pedido creado correctamente",
        "id": str(resultado.inserted_id),
        "total": total,
        "estado": nuevo_order["estado"]
    }


@app.get("/orders/{cliente_id}")
async def get_client_orders(cliente_id: str):
    if not ObjectId.is_valid(cliente_id):
        raise HTTPException(
            status_code=400,
            detail="El ID del cliente no es válido"
        )

    db = get_db()
    coleccion = get_colection(db, "orders")

    orders = await coleccion.find(
        {"cliente_id": ObjectId(cliente_id)}
    ).to_list(length=100)

    for order in orders:
        order["_id"] = str(order["_id"])
        order["cliente_id"] = str(order["cliente_id"])

    return orders

password_hash = PasswordHash.recommended()


class User(BaseModel):
    rut: str
    nombre: str
    direccion: str
    comuna: str
    provincia: str
    region: str
    fecha_nacimiento: date
    sexo: str
    email: EmailStr
    numero: str = Field(min_length=8, max_length=9)
    password: str = Field(min_length=8)


@app.post("/users", status_code=201)
async def create_user(usuario: User):
    db = get_db()
    coleccion = get_colection(db, "users")

    nuevo_usuario = usuario.model_dump(
        exclude={"password"}
    )
    nuevo_usuario["fecha_nacimiento"] = datetime.combine(
        usuario.fecha_nacimiento,
        datetime.min.time(),
        tzinfo=timezone.utc
    )

    nuevo_usuario["email"] = str(usuario.email).strip().lower()

    nuevo_usuario["password_hash"] = password_hash.hash(
        usuario.password
    )

    # Datos que controla el backend
    nuevo_usuario["rol"] = "cliente"
    nuevo_usuario["activo"] = True
    nuevo_usuario["fecha_creacion"] = datetime.now(timezone.utc)

    try:
        resultado = await coleccion.insert_one(nuevo_usuario)

    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="El RUT o el correo ya están registrados"
        )

    return {
        "mensaje": "Usuario creado correctamente",
        "id": str(resultado.inserted_id),
        "nombre": nuevo_usuario["nombre"],
        "email": nuevo_usuario["email"],
        "rol": nuevo_usuario["rol"]
    }
