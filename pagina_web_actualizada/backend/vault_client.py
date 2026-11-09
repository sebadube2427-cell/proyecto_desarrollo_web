import os
import hvac


def obtener_secreto(nombre):

    cliente = hvac.Client(
        url=os.getenv("VAULT_ADDR", "http://127.0.0.1:8200"),
        token=os.getenv("VAULT_TOKEN")
    )

    if not cliente.is_authenticated():
        raise Exception("No se pudo autenticar con Vault")

    respuesta = cliente.secrets.kv.v2.read_secret_version(
        path="desarrollo-web",
        mount_point="secret"
    )

    return respuesta["data"]["data"][nombre]
