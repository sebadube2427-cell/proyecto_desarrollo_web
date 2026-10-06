from fastapi import FastAPI, Header, HTTPException
import os
import hvac
import secrets
from datetime import datetime, timedelta

app = FastAPI(title="Authentication Service")

VAULT_ADDR = os.getenv("VAULT_ADDR")
VAULT_TOKEN = os.getenv("VAULT_TOKEN")

client = hvac.Client(
    url=VAULT_ADDR,
    token=VAULT_TOKEN
)

sesiones = {}


def crear_sesion(username, user_id, roles):
    token = secrets.token_urlsafe(32)

    sesiones[token] = {
        "user_id": user_id,
        "username": username,
        "roles": roles,
        "expires_at": datetime.utcnow() + timedelta(minutes=15)
    }

    return token


@app.post("/login")
async def login(data: dict):
    username = data.get("username")
    password = data.get("password")

    if username != "admin" or password != "1234":
        raise HTTPException(
            status_code=401,
            detail="Credenciales invalidas"
        )

    token = crear_sesion(
        user_id="1",
        username=username,
        roles=["admin"]
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


def obtener_secreto():
    respuesta = client.secrets.kv.v2.read_secret_version(
        path="gateway"
    )

    return respuesta["data"]["data"]["auth_introspection_secret"]


@app.post("/introspect")
async def introspect(
    data: dict,
    x_gateway_auth_secret: str | None = Header(None)
):
    secreto_correcto = obtener_secreto()

    if x_gateway_auth_secret != secreto_correcto:
        raise HTTPException(
            status_code=401,
            detail="Gateway no autorizado"
        )

    token = data.get("token")

    sesion = sesiones.get(token)

    if sesion is None:
        return {
            "active": False
        }

    if datetime.utcnow() >= sesion["expires_at"]:
        del sesiones[token]

        return {
            "active": False
        }

    return {
        "active": True,
        "user_id": sesion["user_id"],
        "username": sesion["username"],
        "roles": sesion["roles"]
    }
