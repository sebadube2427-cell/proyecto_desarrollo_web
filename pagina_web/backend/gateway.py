from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
import httpx

app = FastAPI(title="API Gateway")

CLIENTS_API = "http://127.0.0.1:9000"
ADMIN_API = "http://127.0.0.1:9100"
auth_service_api = "http://127.0.0.1:8100"
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500",
        "http://127.0.0.1:3000",
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
routes = [
    {
        "path": "login",
        "method": ["POST"],
        "destino": auth_service_api,
        "public": True
    },
    {
        "path": "logout",
        "method": ["POST"],
        "destino": auth_service_api,
        "public": False
    },
    {
        "path": "introspect",
        "method": ["POST"],
        "destino": auth_service_api,
        "public": True
    },
    {
        "path": "products",
        "method": ["GET"],
        "destino": CLIENTS_API,
        "public": True
    },
    {
        "path": "users",
        "method": ["POST"],
        "destino": CLIENTS_API,
        "public": True
    },
    {
        "path": "orders",
        "method": ["POST", "GET"],
        "destino": CLIENTS_API,
        "public": False
    },
    {
        "path": "products",
        "method": ["POST", "PATCH", "PUT", "DELETE"],
        "destino": ADMIN_API,
        "public": False
    },
    {
        "path": "orders",
        "method": ["PATCH", "PUT", "DELETE"],
        "destino": ADMIN_API,
        "public": False
    }
]


def buscar_ruta(path: str, metodo: str):
    ruta_existe = False

    for ruta in routes:
        coincide_path = (
            path == ruta["path"]
            or path.startswith(ruta["path"] + "/")
        )

        if coincide_path:
            ruta_existe = True

            coincide_metodo = metodo in ruta["method"]

            if coincide_metodo:
                return ruta

    if ruta_existe:
        raise HTTPException(
            status_code=405,
            detail="El método HTTP no está permitido para esta ruta"
        )

    raise HTTPException(
        status_code=404,
        detail="La ruta solicitada no existe"
    )


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"]
)
async def gateway(request: Request, path: str):
    metodo = request.method

    ruta = buscar_ruta(path, metodo)
    destino = ruta["destino"]
    url = f"{destino}/{path}"

    cuerpo = await request.body()

    async with httpx.AsyncClient() as client:
        respuesta = await client.request(
            method=metodo,
            url=url,
            params=request.query_params,
            content=cuerpo,
            headers={
                "content-type": request.headers.get(
                    "content-type",
                    "application/json"
                )
            }
        )

    return Response(
        content=respuesta.content,
        status_code=respuesta.status_code,
        headers={
            key: value
            for key, value in respuesta.headers.items()
            if key.lower() not in [
                "content-length",
                "transfer-encoding",
                "connection"
            ]
        }
    )
