from fastapi import FastAPI
import httpx

app = FastAPI(title="Local API Gateway")

PRODUCTOS_API = "http://localhost:9000"
ORDENES_API = "http://localhost:9100"


@app.get("/api/products")
async def products():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{PRODUCTOS_API}/products"
        )

    return response.json()


@app.get("/api/orders")
async def orders():
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ORDENES_API}/orders"
        )

    return response.json()
