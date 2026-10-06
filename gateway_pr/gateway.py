import os
import secrets
import httpx
import hvac

from fastapi import (
    FastAPI,
    Depends,
    HTTPException,
    Request,
    Response
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

app = FastAPI(title="Local API Gateway")

security = HTTPBearer(
    auto_error=False
)


AUTH_SERVICE_URL = os.getenv(
    "AUTH_SERVICE_URL",
    "http://127.0.0.1:8100"
)

PRODUCTOS_API = "http://localhost:9000"
ORDENES_API = "http://localhost:9100"


VAULT_ADDR = os.getenv("VAULT_ADDR")
VAULT_TOKEN = os.getenv("VAULT_TOKEN")

client = hvac.Client(
    url=VAULT_ADDR,
    token=VAULT_TOKEN
)


def obtener_secretos():
    respuesta = client.secrets.kv.v2.read_secret_version(
        path="gateway"
    )

    return respuesta["data"]["data"]


async def authenticate_client(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials is None:
        raise HTTPException(
            status_code=401,
            detail="Bearer token requerido"
        )

    secretos = obtener_secretos()

    introspection_secret = secretos[
        "auth_introspection_secret"
    ]

    try:
        async with httpx.AsyncClient(
            timeout=5.0
        ) as client_http:

            response = await client_http.post(
                f"{AUTH_SERVICE_URL}/introspect",
                json={
                    "token": credentials.credentials
                },
                headers={
                    "X-Gateway-Auth-Secret":
                        introspection_secret
                }
            )

    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Error consultando Authentication Service"
        )

    identity = response.json()

    if not identity.get("active", False):
        raise HTTPException(
            status_code=401,
            detail="Token invalido o expirado"
        )

    return identity


@app.api_route(
    "/api/{path:path}",
    methods=["GET", "POST", "PUT", "PATCH", "DELETE"]
)
async def proxy(
    path: str,
    request: Request,
    auth=Depends(authenticate_client)
):
    if path.startswith("products"):
        target_url = f"{PRODUCTOS_API}/{path}"
    elif path.startswith("orders"):
        target_url = f"{ORDENES_API}/{path}"
    else:
        raise HTTPException(
            status_code=404,
            detail="Ruta no encontrada"
        )
    body = await request.body()

    secretos = obtener_secretos()

    gateway_headers = {
        "X-Internal-Secret": secretos["internal_gateway_secret"],
        "X-Authenticated-User": auth["username"],
        "X-Authenticated-Roles": ",".join(auth["roles"]),
        "X-Authenticated-User-ID": auth["user_id"]
    }

    content_type = request.headers.get("content-type")

    if content_type:
        gateway_headers["content-type"] = content_type
    try:
        async with httpx.AsyncClient(timeout=10.0) as client_http:
            upstream = await client_http.request(
                method=request.method,
                url=target_url,
                params=request.query_params,
                content=body,
                headers=gateway_headers
            )
    except httpx.RequestError:
        raise HTTPException(
            status_code=502,
            detail="Backend no disponible"
        )
    response_headers = {}

    if "content-type" in upstream.headers:
        response_headers["content-type"] = upstream.headers["content-type"]

    return Response(
        content=upstream.content,
        status_code=upstream.status_code,
        headers=response_headers
    )
