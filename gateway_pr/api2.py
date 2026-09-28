from fastapi import FastAPI, Header, Depends, HTTPException
import json
import os
import hvac

app = FastAPI(title="API Órdenes")


VAULT_ADDR = os.getenv("VAULT_ADDR")
VAULT_TOKEN = os.getenv("VAULT_TOKEN")

client = hvac.Client(
    url=VAULT_ADDR,
    token=VAULT_TOKEN
)


def obtener_secreto():
    respuesta = client.secrets.kv.v2.read_secret_version(
        path="gateway"
    )

    return respuesta["data"]["data"]["internal_gateway_secret"]


def cargar_datos():
    with open("base_prueba.json", "r", encoding="utf-8") as archivo:
        return json.load(archivo)


def verificar_gateway(
    x_internal_secret: str | None = Header(None)
):
    secreto_correcto = obtener_secreto()

    if x_internal_secret != secreto_correcto:
        raise HTTPException(
            status_code=401,
            detail="No autorizado"
        )


@app.get("/orders")
async def orders(
    _: None = Depends(verificar_gateway)
):
    datos = cargar_datos()
    return datos["ordenes"]
