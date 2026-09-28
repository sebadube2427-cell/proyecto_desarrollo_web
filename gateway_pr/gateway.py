from fastapi import FastAPI
import httpx
import os
import hvac

app = FastAPI(title="Local API Gateway")


PRODUCTOS_API = "http://localhost:9000"
ORDENES_API = "http://localhost:9100"


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


@app.get("/api/products")
async def products():

    secreto = obtener_secreto()

    async with httpx.AsyncClient() as client_http:
        response = await client_http.get(
            f"{PRODUCTOS_API}/products",
            headers={
                "X-Internal-Secret": secreto
            }
        )

    return response.json()


@app.get("/api/orders")
async def orders():

    secreto = obtener_secreto()

    async with httpx.AsyncClient() as client_http:
        response = await client_http.get(
            f"{ORDENES_API}/orders",
            headers={
                "X-Internal-Secret": secreto
            }
        )

    return response.json()
