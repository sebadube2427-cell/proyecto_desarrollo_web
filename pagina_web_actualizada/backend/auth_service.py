
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
import secrets

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
from pwdlib import PasswordHash

from database import get_db, get_colection
from vault_client import obtener_secreto


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Cargar el secreto desde Vault al iniciar Auth
    app.state.internal_secret = obtener_secreto("INTERNAL_SECRET")

    print("Secreto interno cargado correctamente desde Vault.")

    yield


app = FastAPI(
    title="Authentication Service",
    lifespan=lifespan
)

password_hash = PasswordHash.recommended()

# Sesiones temporales guardadas en memoria
sesiones = {}

DURACION_TOKEN_MINUTOS = 60
NOMBRE_COOKIE = "access_token"


# Middleware para permitir solicitudes únicamente desde el Gateway
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


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@app.post("/login")
async def login(datos: LoginRequest, response: Response):
    db = get_db()
    coleccion = get_colection(db, "users")

    email = str(datos.email).strip().lower()

    # Buscar la cuenta
    usuario = await coleccion.find_one({"email": email})

    if usuario is None:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    # Verificar contraseña guardada como hash
    hash_guardado = usuario.get("password_hash")

    if not hash_guardado or not password_hash.verify(
        datos.password,
        hash_guardado
    ):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    if not usuario.get("activo", True):
        raise HTTPException(
            status_code=403,
            detail="Cuenta desactivada"
        )

    # Generar un token aleatorio
    token = secrets.token_urlsafe(32)

    # Definir la expiración
    expiracion = datetime.now(timezone.utc) + timedelta(
        minutes=DURACION_TOKEN_MINUTOS
    )

    # Guardar la sesión asociada al usuario
    sesiones[token] = {
        "user_id": str(usuario["_id"]),
        "email": usuario["email"],
        "rol": usuario.get("rol", "cliente"),
        "expira": expiracion
    }

    # Crear cookie HttpOnly
    response.set_cookie(
        key=NOMBRE_COOKIE,
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=DURACION_TOKEN_MINUTOS * 60,
        path="/"
    )

    return {
        "mensaje": "Inicio de sesión correcto",
        "expires_in": DURACION_TOKEN_MINUTOS * 60
    }


@app.post("/introspect")
async def introspect(request: Request, response: Response):

    token = request.cookies.get(NOMBRE_COOKIE)

    print("COOKIE RECIBIDA:", token is not None)
    print("NOMBRE COOKIE:", NOMBRE_COOKIE)

    if not token:
        print("ERROR: No llegó ninguna cookie.")
        return {"active": False}

    sesion = sesiones.get(token)

    print("SESION ENCONTRADA:", sesion is not None)

    if sesion is None:
        print("ERROR: El token no existe en el diccionario de sesiones.")
        return {"active": False}

    if datetime.now(timezone.utc) >= sesion["expira"]:
        print("ERROR: La sesión expiró.")

        sesiones.pop(token, None)

        response.delete_cookie(
            key=NOMBRE_COOKIE,
            path="/",
            httponly=True,
            secure=False,
            samesite="lax"
        )

        return {"active": False}

    print("SESION ACTIVA:", sesion["rol"])

    return {
        "active": True,
        "user_id": sesion["user_id"],
        "email": sesion["email"],
        "rol": sesion["rol"],
        "exp": int(sesion["expira"].timestamp())
    }


@app.post("/logout")
async def logout(request: Request, response: Response):

    # Obtener el token desde la cookie
    token = request.cookies.get(NOMBRE_COOKIE)

    if token:
        # Eliminar la sesión del servidor
        sesiones.pop(token, None)

    # Eliminar la cookie del navegador
    response.delete_cookie(
        key=NOMBRE_COOKIE,
        path="/",
        httponly=True,
        secure=False,
        samesite="lax"
    )

    return {
        "mensaje": "Sesión cerrada correctamente"
    }
