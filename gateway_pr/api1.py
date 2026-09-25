from fastapi import FastAPI
import json

app = FastAPI(title="API Productos")


def cargar_datos():
    with open("base_prueba.json", "r", encoding="utf-8") as archivo:
        return json.load(archivo)


@app.get("/products")
async def products():
    datos = cargar_datos()
    return datos["productos"]
