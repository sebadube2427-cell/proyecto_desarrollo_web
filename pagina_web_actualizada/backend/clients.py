from contextlib import asynccontextmanager
from fastapi.responses import JSONResponse
import secrets
from vault_client import obtener_secreto
from datetime import datetime, timezone, date
from typing import List
from pydantic import BaseModel, Field, EmailStr
from fastapi import (
    FastAPI,
    Request,
    Header,
    HTTPException)
from typing import Literal
from pymongo.errors import DuplicateKeyError
from pwdlib import PasswordHash
from bson import ObjectId
from database import get_colection, get_db

# fastapi


@asynccontextmanager
async def lifespan(app: FastAPI):

    # Cargar el secreto desde Vault al iniciar Clients
    app.state.internal_secret = obtener_secreto("INTERNAL_SECRET")

    print("Secreto interno cargado correctamente desde Vault.")

    yield


app = FastAPI(
    title="Clients API",
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


class UserProfile(BaseModel):
    rut: str
    nombre: str
    direccion: str
    comuna: str
    provincia: str
    region: str
    fecha_nacimiento: date
    sexo: str
    email: EmailStr
    numero: str


async def obtener_usuario(user_id: str, devolver_usuario: bool = False):
    # esta funcion sirve para validar que el userid es un objectid y existe en la base de datos, la validacion de permisos la hace el gateway
    # tambien devuelve los datos del usuario si es requerido por el endpoint
    if not ObjectId.is_valid(user_id):
        raise HTTPException(
            status_code=400,
            detail="ID de usuario inválido"
        )

    db = get_db()
    coleccion_usuarios = get_colection(db, "users")
    usuario = await coleccion_usuarios.find_one({
        "_id": ObjectId(user_id)
    })

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return usuario


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
    productos: List[ProductoPedido] = Field(min_length=1)
    observacion: str = ""
    direccion: str | None = None


@app.post("/orders", status_code=201)
async def post_order(order: Order, user_id: str = Header(alias="X-User-ID")):

    usuario = await obtener_usuario(user_id, devolver_usuario=True)

    db = get_db()

    coleccion_pedidos = get_colection(db, "orders")
    coleccion_productos = get_colection(db, "products")

    total = await calcular_total(
        order.productos,
        coleccion_productos
    )

    nuevo_order = order.model_dump()

    nuevo_order["cliente_id"] = ObjectId(user_id)

    nuevo_order["productos"] = []

    for item in order.productos:
        producto = await coleccion_productos.find_one({
            "_id": ObjectId(item.producto_id)
        })

        nuevo_order["productos"].append({
            "producto_id": item.producto_id,
            "nombre": producto["nombre"],
            "precio": producto["precio"],
            "cantidad": item.cantidad
        })

    nuevo_order["direccion"] = usuario["direccion"]
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


@app.get("/orders/me")
async def get_my_orders(
    user_id: str = Header(alias="X-User-ID")
):
    await obtener_usuario(user_id)

    # Conectar con MongoDB
    db = get_db()
    coleccion = get_colection(db, "orders")

    # Buscar todos los pedidos del usuario
    orders = await coleccion.find(
        {"cliente_id": ObjectId(user_id)}
    ).to_list(length=100)

    # Convertir los ObjectId a string
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


@app.get("/users/me", response_model=UserProfile)
async def get_my_profile(
    user_id: str = Header(alias="X-User-ID")
):
    await obtener_usuario(user_id)

    db = get_db()
    coleccion = get_colection(db, "users")

    usuario = await coleccion.find_one(
        {"_id": ObjectId(user_id)},
        {
            "_id": 0,
            "password_hash": 0,
            "rol": 0,
            "activo": 0,
            "fecha_creacion": 0
        }
    )

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    # Convertir datetime de MongoDB a date
    if isinstance(usuario.get("fecha_nacimiento"), datetime):
        usuario["fecha_nacimiento"] = (
            usuario["fecha_nacimiento"].date()
        )

    return usuario


class UserProfileUpdate(BaseModel):
    rut: str | None = None
    nombre: str | None = None
    direccion: str | None = None
    comuna: str | None = None
    provincia: str | None = None
    region: str | None = None
    fecha_nacimiento: date | None = None
    sexo: str | None = None
    email: EmailStr | None = None
    numero: str | None = Field(
        default=None,
        min_length=8,
        max_length=11
    )


@app.patch("/users/me", response_model=UserProfile)
async def update_my_profile(
    datos: UserProfileUpdate,
    user_id: str = Header(alias="X-User-ID")
):
    await obtener_usuario(user_id)

    # Obtener solamente los campos enviados
    cambios = datos.model_dump(
        exclude_unset=True,
        exclude_none=True
    )

    if not cambios:
        raise HTTPException(
            status_code=400,
            detail="No se enviaron datos para modificar"
        )

    if "email" in cambios:
        cambios["email"] = str(cambios["email"]).strip().lower()

    if "fecha_nacimiento" in cambios:
        cambios["fecha_nacimiento"] = datetime.combine(
            cambios["fecha_nacimiento"],
            datetime.min.time(),
            tzinfo=timezone.utc
        )

    db = get_db()
    coleccion = get_colection(db, "users")

    try:
        resultado = await coleccion.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": cambios}
        )

    except DuplicateKeyError:
        raise HTTPException(
            status_code=409,
            detail="El RUT o el correo ya están registrados"
        )

    if resultado.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    usuario = await coleccion.find_one(
        {"_id": ObjectId(user_id)},
        {
            "_id": 0,
            "password_hash": 0,
            "rol": 0,
            "activo": 0,
            "fecha_creacion": 0
        }
    )

    if isinstance(usuario.get("fecha_nacimiento"), datetime):
        usuario["fecha_nacimiento"] = (
            usuario["fecha_nacimiento"].date()
        )

    return usuario


class Solicitud(BaseModel):
    tipo_solicitud: Literal["contacto", "anulacion"]

    tipo: str | None = None
    fecha: date | None = None
    personas: int | None = Field(default=None, ge=1, le=12)
    mensaje: str | None = Field(default=None, max_length=500)

    pedido_id: str | None = None
    motivo: str | None = Field(default=None, max_length=500)


@app.post("/solicitudes", status_code=201)
async def crear_solicitud(
    solicitud: Solicitud,
    user_id: str = Header(alias="X-User-ID")
):
    usuario = await obtener_usuario(user_id, devolver_usuario=True)

    db = get_db()
    coleccion = get_colection(db, "solicitudes")

    nueva_solicitud = solicitud.model_dump(exclude_none=True)

    if solicitud.tipo_solicitud == "contacto":

        if not solicitud.tipo or not solicitud.fecha or not solicitud.mensaje or not solicitud.personas:
            raise HTTPException(
                status_code=400,
                detail="Faltan datos obligatorios de la solicitud"
            )

        nueva_solicitud["fecha"] = datetime.combine(
            solicitud.fecha,
            datetime.min.time()
        )

    elif solicitud.tipo_solicitud == "anulacion":

        if not solicitud.pedido_id or not solicitud.motivo:
            raise HTTPException(
                status_code=400,
                detail="Debes indicar el pedido y el motivo de anulación"
            )

        if not ObjectId.is_valid(solicitud.pedido_id):
            raise HTTPException(
                status_code=400,
                detail="ID de pedido inválido"
            )

        nueva_solicitud["pedido_id"] = ObjectId(solicitud.pedido_id)

    nueva_solicitud["cliente_id"] = ObjectId(user_id)
    nueva_solicitud["nombre"] = usuario["nombre"]
    nueva_solicitud["correo"] = usuario["email"]
    nueva_solicitud["telefono"] = usuario["numero"]
    nueva_solicitud["fecha_creacion"] = datetime.now(timezone.utc)
    nueva_solicitud["estado"] = "pendiente"

    resultado = await coleccion.insert_one(nueva_solicitud)

    return {
        "mensaje": "Solicitud enviada correctamente",
        "id": str(resultado.inserted_id)
    }
