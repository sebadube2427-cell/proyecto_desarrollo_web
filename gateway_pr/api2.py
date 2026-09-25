from fastapi import FastAPI
import json

app = FastAPI(title="API Órdenes")


def cargar_datos():
    with open("base_prueba.json", "r", encoding="utf-8") as archivo:
        return json.load(archivo)


@app.get("/orders")
async def orders():
    datos = cargar_datos()
    return datos["ordenes"]
