
from datetime import datetime, timedelta, timezone
import secrets

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, EmailStr
from pwdlib import PasswordHash

from database import get_db, get_colection


app = FastAPI(title="Authentication Service")

password_hash = PasswordHash.recommended()

# Sesiones temporales guardadas en memoria
sesiones = {}

DURACION_TOKEN_MINUTOS = 60


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenRequest(BaseModel):
    token: str


@app.post("/login")
async def login(datos: LoginRequest):
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

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in": DURACION_TOKEN_MINUTOS * 60
    }


@app.post("/introspect")
async def introspect(datos: TokenRequest):
    sesion = sesiones.get(datos.token)

    # El token no existe o ya fue invalidado
    if sesion is None:
        return {
            "active": False
        }

    # Comprobar expiración
    if datetime.now(timezone.utc) >= sesion["expira"]:
        sesiones.pop(datos.token, None)

        return {
            "active": False
        }

    # Token válido
    return {
        "active": True,
        "user_id": sesion["user_id"],
        "email": sesion["email"],
        "rol": sesion["rol"],
        "exp": int(sesion["expira"].timestamp())
    }


@app.post("/logout")
async def logout(datos: TokenRequest):
    sesion = sesiones.pop(datos.token, None)

    if sesion is None:
        raise HTTPException(
            status_code=401,
            detail="Token inválido o sesión ya cerrada"
        )

    return {
        "mensaje": "Sesión cerrada correctamente"
    }
