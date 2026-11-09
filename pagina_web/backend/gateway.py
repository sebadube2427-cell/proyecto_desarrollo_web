from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import Response
import httpx
from vault_client import obtener_secreto

INTERNAL_SECRET = None


@asynccontextmanager
async def lifespan(app: FastAPI):

    global INTERNAL_SECRET

    INTERNAL_SECRET = obtener_secreto("INTERNAL_SECRET")

    print("Secretos cargados correctamente desde Vault.")

    yield


app = FastAPI(title="API Gateway", lifespan=lifespan)


CLIENTS_API = "http://127.0.0.1:9000"
ADMIN_API = "http://127.0.0.1:9100"
auth_service_api = "http://127.0.0.1:8100"
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=[
        "GET",
        "POST",
        "PATCH",
        "DELETE"
    ],
    allow_headers=[
        "Content-Type"
    ],
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
        "path": "users/me",
        "method": ["GET", "PATCH"],
        "destino": CLIENTS_API,
        "public": False
    },
    {
        "path": "orders/me",
        "method": ["GET"],
        "destino": CLIENTS_API,
        "public": False
    },
    {
        "path": "orders",
        "method": ["POST"],
        "destino": CLIENTS_API,
        "public": False
    },
    {
        "path": "solicitudes",
        "method": ["POST"],
        "destino": CLIENTS_API,
        "public": False
    },
    {
        "path": "admin/products/{producto_id}",
        "method": ["POST", "PATCH", "PUT", "DELETE"],
        "destino": ADMIN_API,
        "public": False
    },
    {
        "path": "admin/orders",
        "method": ["GET"],
        "destino": ADMIN_API,
        "public": False
    },
    {
        "path": "admin/orders/{pedido_id}",
        "method": ["PATCH"],
        "destino": ADMIN_API,
        "public": False
    },
    {
        "path": "admin/solicitudes",
        "method": ["GET"],
        "destino": ADMIN_API,
        "public": False
    },
    {
        "path": "admin/ganancias",
        "method": ["GET"],
        "destino": ADMIN_API,
        "public": False
    }
]


def buscar_ruta(path: str, metodo: str):

    ruta_existe = False

    for ruta in routes:

        partes_path = path.strip("/").split("/")
        partes_ruta = ruta["path"].strip("/").split("/")

        # Si tienen distinta cantidad de segmentos, no coinciden
        if len(partes_path) != len(partes_ruta):
            continue

        coincide_path = True

        for parte_path, parte_ruta in zip(partes_path, partes_ruta):

            # Si es un parámetro dinámico, aceptar cualquier valor
            if parte_ruta.startswith("{") and parte_ruta.endswith("}"):
                continue

            # Si no es dinámico, debe coincidir exactamente
            if parte_path != parte_ruta:
                coincide_path = False
                break

        if coincide_path:

            ruta_existe = True

            coincide_metodo = metodo.upper() in [
                m.upper() for m in ruta["method"]
            ]

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

    headers = {
        "X-Internal-Secret": INTERNAL_SECRET
    }

    content_type = request.headers.get("content-type")
    if content_type:
        headers["content-type"] = content_type

    cookie = request.headers.get("cookie")

    async with httpx.AsyncClient() as client:

        if not ruta["public"]:

            if not cookie:
                raise HTTPException(
                    status_code=401,
                    detail="No se ha iniciado sesión"
                )

            try:
                respuesta_auth = await client.post(
                    f"{auth_service_api}/introspect",
                    headers={
                        "cookie": cookie,
                        "X-Internal-Secret": INTERNAL_SECRET
                    }
                )
            except httpx.RequestError:
                raise HTTPException(
                    status_code=503,
                    detail="No se pudo conectar con el servicio de autenticación"
                )

            if respuesta_auth.status_code != 200:
                raise HTTPException(
                    status_code=401,
                    detail="No se pudo validar la sesión"
                )

            sesion = respuesta_auth.json()

            if not sesion.get("active"):
                raise HTTPException(
                    status_code=401,
                    detail="Sesión no válida o expirada"
                )

            if destino == ADMIN_API and sesion.get("rol") != "admin":
                raise HTTPException(
                    status_code=403,
                    detail="No tienes permisos para realizar esta acción"
                )

            headers["X-User-ID"] = sesion["user_id"]
            headers["X-User-Rol"] = sesion["rol"]

        if destino == auth_service_api and cookie:
            headers["cookie"] = cookie

        respuesta = await client.request(
            method=metodo,
            url=url,
            params=request.query_params,
            content=cuerpo,
            headers=headers
        )

    respuesta_gateway = Response(
        content=respuesta.content,
        status_code=respuesta.status_code
    )

    for cookie in respuesta.headers.get_list("set-cookie"):
        respuesta_gateway.headers.append("set-cookie", cookie)

    for key, value in respuesta.headers.items():
        if key.lower() not in [
            "content-length",
            "transfer-encoding",
            "connection",
            "set-cookie"
        ]:
            respuesta_gateway.headers[key] = value

    return respuesta_gateway
