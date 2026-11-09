Pagina web tipo ecommerce en base a el proyecto de desarrollo web y móbil unab 2026.
corresponde al caso 7 del comercio para un restaurante peruano "Sabor Limeño", pagina responsiva que permite crear pedidos a domicilio previa creacion de cuenta 
mirar un menu, crear solicitudes y más.


# Arquitectura y Diseño del Backend

**Estudiante:** Sebastián Dubé\
**Profesor:** Ernesto Vivanco\
**NRC:** 8480

## Introducción

El backend del sistema fue desarrollado utilizando una arquitectura
basada en capas y servicios independientes, buscando separar las
responsabilidades de autenticación, gestión de usuarios, administración
y acceso a los datos. Para ello, se implementó un API Gateway como punto
de entrada principal, encargado de gestionar las solicitudes, controlar
el acceso y derivarlas al servicio correspondiente. Además, se
incorporaron mecanismos de seguridad como gestión de sesiones mediante
cookies HttpOnly, validación de permisos, almacenamiento seguro de
secretos mediante HashiCorp Vault y conexión a MongoDB para la
persistencia de la información.

El backend se divide en distintos archivos escritos en código Python,
creando APIs con FastAPI y utilizando el administrador de secretos
HashiCorp.

Junto con el backend se entregará el frontend con la mayoría de los
requerimientos del caso 19 ya listo, por lo que es posible probar casi
todas las funciones como crear sesión, iniciar sesión, logout, crear
pedidos, etc., aunque no corresponda a la entrega, por lo que no está
listo todo el frontend y siguen existiendo errores que se corregirán
para la entrega 3.

## Gateway.py

En este archivo Python se construye el gateway que redirige todas las
solicitudes hacia los demás servicios. La variable `routes` contiene una
lista con todas las solicitudes que se pueden hacer, junto con la API a
la que corresponde la solicitud y si esta solicitud es privada o no (si
se necesita una sesión activa para acceder). Esta es usada por la
función `buscar_ruta`, la cual recibe la solicitud, busca si existe la
ruta y a qué API corresponde.

La función `gateway` es la encargada de procesar las solicitudes
recibidas y determinar cómo deben ser atendidas. Primero, obtiene la
ruta y el método HTTP de la solicitud, y utiliza `buscar_ruta` para
comprobar si existe una configuración correspondiente. Si la ruta es
privada, verifica que el usuario tenga una sesión activa mediante el
servicio de autenticación y comprueba que cuente con los permisos
necesarios para acceder al recurso. Posteriormente, agrega el
identificador del usuario y el secreto interno requerido para la
comunicación entre servicios, y reenvía la solicitud al microservicio
correspondiente. Finalmente, recibe la respuesta de dicho servicio y la
devuelve al cliente, manteniendo así un único punto de entrada para la
comunicación con el backend.

## Auth_service.py

El servicio de autenticación es responsable de gestionar el inicio y
cierre de sesión de los usuarios, así como de validar la vigencia de las
sesiones existentes. Para ello, dispone de tres endpoints principales:
`login`, encargado de verificar las credenciales y generar un token de
sesión; `introspect`, que permite comprobar si una sesión sigue activa y
obtener información del usuario, como su identificador y rol; y
`logout`, que invalida la sesión y elimina la cookie correspondiente.

Los tokens de sesión se entregan mediante cookies con las propiedades
HttpOnly, evitando que puedan ser accedidas directamente desde
JavaScript. Además, el servicio establece un tiempo de expiración para
las sesiones y permite verificar los roles de los usuarios para
determinar sus permisos dentro del sistema.

Finalmente, el servicio incorpora un middleware de seguridad que valida
el secreto interno obtenido desde HashiCorp Vault, permitiendo que
únicamente las solicitudes provenientes del Gateway, que conocen dicho
secreto, puedan acceder a sus endpoints.

## Clients.py

El servicio Clients contiene los endpoints destinados a los usuarios del
sistema, permitiéndoles realizar las operaciones habituales de la
plataforma. Entre sus funcionalidades se encuentran el registro de
nuevas cuentas, la consulta y modificación de datos personales, la
creación de pedidos, la consulta del historial de compras y el envío de
solicitudes, como reservas de mesa, anulaciones de compras u otras
peticiones.

Para garantizar la integridad de la información, se utilizan modelos de
validación de Pydantic (`BaseModel`), que definen los campos y tipos de
datos que cada solicitud puede recibir. De esta manera, se evita que los
usuarios puedan enviar o modificar información que no les corresponde,
como asignarse el rol de administrador o alterar directamente los
precios de los productos. Los datos que deben ser determinados por el
sistema, como los identificadores, roles, estados y totales de los
pedidos, son generados o calculados directamente en el backend.

Finalmente, al igual que los demás microservicios, incorpora un
middleware de seguridad que valida el secreto interno obtenido desde
HashiCorp Vault, rechazando las solicitudes que no provengan del Gateway
autorizado.

## Admin.py

El servicio Admin contiene los endpoints destinados exclusivamente a las
operaciones administrativas del sistema, a las cuales los usuarios con
rol de cliente no deben tener acceso. Entre sus funcionalidades se
encuentran la modificación de precios y disponibilidad de los productos,
la consulta de ventas en determinados periodos, la actualización del
estado de los pedidos de pendiente de pago a pagado y la revisión de
solicitudes realizadas por los clientes.

Al igual que en Clients, se utilizan modelos Pydantic (`BaseModel`) para
validar y restringir los datos que pueden recibirse en cada solicitud.
Esto permite limitar las operaciones disponibles incluso para los
administradores, evitando modificaciones indebidas, como alterar
arbitrariamente los datos de un pedido o una solicitud en perjuicio del
cliente.

En cuanto a la seguridad, el servicio incorpora un middleware que valida
el secreto interno obtenido desde HashiCorp Vault, rechazando las
solicitudes que no incluyan el secreto correspondiente. Además, es
importante destacar que este microservicio no realiza directamente la
autenticación ni la autorización de los usuarios. Estas
responsabilidades recaen en el API Gateway, que verifica la existencia
de una sesión activa y comprueba que el usuario tenga el rol de
administrador antes de permitir el acceso a los endpoints de este
servicio. De esta forma, se centraliza el control de acceso y se evita
duplicar la lógica de autenticación en los distintos microservicios.

## Vault_client.py

Este módulo se encarga de establecer la comunicación entre los servicios
del backend y HashiCorp Vault, utilizado como administrador centralizado
de secretos. Para ello, implementa la función `obtener_secreto`, que
permite recuperar credenciales y claves almacenadas de forma segura,
evitando tener que escribir información sensible directamente en el
código fuente.

La función crea un cliente de Vault utilizando las variables de entorno
`VAULT_ADDR` y `VAULT_TOKEN`, verifica que la autenticación sea válida y
posteriormente consulta el secreto solicitado dentro del motor de
almacenamiento KV versión 2. Finalmente, devuelve el valor
correspondiente al nombre indicado, permitiendo que los distintos
microservicios obtengan los secretos que necesitan durante su
inicialización.

## Database.py

Este módulo se encarga de establecer y administrar la conexión con la
base de datos MongoDB, utilizando el controlador asíncrono oficial de
PyMongo (`AsyncMongoClient`). En él se define la dirección de conexión,
el nombre de la base de datos y las funciones auxiliares `get_db()` y
`get_colection()`, que permiten obtener la instancia de la base de datos
y acceder a sus respectivas colecciones desde los distintos
microservicios.

Respecto a la seguridad, este archivo no implementa mecanismos propios
de autenticación o autorización, ya que no constituye un servicio ni un
punto de entrada accesible para los usuarios, sino un módulo interno de
infraestructura utilizado exclusivamente por el backend. El control de
acceso se realiza en las capas superiores, mediante el Gateway y los
microservicios, que validan las solicitudes y determinan qué operaciones
pueden ejecutarse sobre los datos. Además, MongoDB se mantiene como un
servicio independiente dentro del entorno local de desarrollo, sin
exponer sus operaciones directamente al frontend.

Por lo tanto, la responsabilidad de este módulo es gestionar la conexión
y facilitar el acceso a los datos, mientras que los controles de
seguridad se aplican en los componentes que interactúan con las
solicitudes de los usuarios.

# 4. Instalación, configuración y ejecución del backend

## 4.1. Requisitos previos

Para ejecutar el backend es necesario contar con las siguientes
herramientas instaladas:

-   **Python:** lenguaje utilizado para desarrollar los servicios del
    backend.
-   **MongoDB Community Server:** sistema gestor de bases de datos
    utilizado para almacenar la información del sistema.
-   **HashiCorp Vault:** administrador de secretos utilizado para
    almacenar y proporcionar las claves internas de comunicación entre
    servicios.
-   **HashiCorp Vault CLI:** herramienta de línea de comandos para
    configurar Vault y administrar sus secretos.
-   **curl:** herramienta para realizar solicitudes HTTP y probar los
    endpoints del backend desde una terminal.

## 4.2. Instalación de dependencias

Una vez descargado el proyecto, se debe abrir una terminal en la carpeta
donde se encuentran los archivos Python del backend.

Se recomienda crear un entorno virtual para mantener aisladas las
dependencias:

``` powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

Posteriormente, instalar las siguientes librerías:

``` powershell
pip install fastapi uvicorn httpx pymongo hvac pwdlib email-validator
```

Estas librerías cumplen las siguientes funciones:

  -----------------------------------------------------------------------
  Librería                            Utilización
  ----------------------------------- -----------------------------------
  FastAPI                             Construcción de los servicios y sus
                                      endpoints.

  Uvicorn                             Servidor ASGI encargado de ejecutar
                                      las aplicaciones FastAPI.

  HTTPX                               Comunicación HTTP entre el Gateway
                                      y los microservicios.

  PyMongo                             Conexión y operaciones con MongoDB.

  HVAC                                Comunicación con HashiCorp Vault.

  pwdlib                              Hash y verificación de contraseñas.

  email-validator                     Validación de direcciones de correo
                                      electrónico mediante Pydantic.
  -----------------------------------------------------------------------

## 4.3. Configuración de variables de entorno

Antes de ejecutar los servicios es necesario configurar las variables de
entorno utilizadas para establecer la conexión con MongoDB y HashiCorp
Vault.

Las variables requeridas son:

  -----------------------------------------------------------------------
  Variable                            Descripción
  ----------------------------------- -----------------------------------
  `MONGO_URL`                         Dirección de conexión a MongoDB.

  `NOMBRE_DB`                         Nombre de la base de datos que
                                      utilizará el sistema.

  `VAULT_ADDR`                        Dirección donde se encuentra
                                      ejecutándose HashiCorp Vault.

  `VAULT_TOKEN`                       Token de acceso limitado utilizado
                                      por los servicios para consultar
                                      los secretos almacenados en Vault.
  -----------------------------------------------------------------------

En PowerShell, las variables se pueden configurar mediante los
siguientes comandos:

``` powershell
$env:MONGO_URL="mongodb://localhost:27017"
$env:NOMBRE_DB="production"
$env:VAULT_ADDR="http://127.0.0.1:8200"
$env:VAULT_TOKEN="TOKEN_LIMITADO"
```

Estas variables deben configurarse en cada terminal desde la cual se
ejecutará un servicio que las necesite. En particular, MongoDB es
utilizado por Clients y Admin, mientras que Vault es utilizado por los
cuatro servicios del backend.

### Configuración inicial de HashiCorp Vault

Para preparar Vault, primero se debe iniciar el servidor en modo
desarrollo:

``` powershell
cd C:\Hashicorp\Vault
.\vault server -dev
```

La terminal debe permanecer abierta mientras se ejecuta el backend. Al
iniciar, Vault entrega un token raíz (*root token*), que se utilizará
únicamente para realizar la configuración inicial.

En otra terminal, configurar la dirección y el token raíz:

``` powershell
$env:VAULT_ADDR="http://127.0.0.1:8200"
$env:VAULT_TOKEN="TOKEN_ROOT"
```

A continuación, generar el secreto interno que utilizarán los
microservicios para verificar que las solicitudes provengan del Gateway:

``` powershell
$bytes = New-Object byte[] 32
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$INTERNAL_SECRET = [Convert]::ToBase64String($bytes)
```

Almacenar el secreto en Vault:

``` powershell
.\vault kv put secret/desarrollo-web INTERNAL_SECRET="$INTERNAL_SECRET"
```

Posteriormente, crear una política que permita únicamente consultar el
secreto almacenado:

``` powershell
$policy = @'
path "secret/data/desarrollo-web" {
    capabilities = ["read"]
}
'@

$policy | .\vault policy write desarrollo-web-read -
```

Finalmente, generar un token limitado asociado a dicha política:

``` powershell
.\vault token create -policy="desarrollo-web-read" -ttl="768h"
```

El token generado debe utilizarse como valor de la variable
`VAULT_TOKEN` en los servicios del backend. El token raíz no debe
utilizarse para ejecutar las aplicaciones.

El secreto `INTERNAL_SECRET` se mantiene almacenado en Vault y es
recuperado por los servicios durante su inicialización, sin necesidad de
escribirlo directamente en los archivos Python.

**Nota:** Vault se utiliza en modo desarrollo para facilitar la
evaluación local. En este modo, los datos se mantienen en memoria y se
pierden al detener el servidor, por lo que será necesario repetir la
configuración inicial al volver a iniciarlo.

## 4.4. Ejecución de los servicios

Una vez instaladas las dependencias, iniciada la base de datos,
configuradas las variables de entorno y preparado Vault, se pueden
ejecutar los distintos servicios.

Cada servicio debe iniciarse en una terminal independiente, manteniendo
las terminales abiertas mientras se realizan las pruebas.

El orden recomendado de ejecución es el siguiente:

**1. HashiCorp Vault**

``` powershell
cd C:\Hashicorp\Vault
.\vault server -dev
```

**2. Auth Service**

Desde la carpeta del backend:

``` powershell
uvicorn auth_service:app --host 127.0.0.1 --port 8100
```

**3. Clients API**

``` powershell
uvicorn clients:app --host 127.0.0.1 --port 9000
```

**4. Admin API**

``` powershell
uvicorn admin:app --host 127.0.0.1 --port 9100
```

**5. API Gateway**

``` powershell
uvicorn gateway:app --host 127.0.0.1 --port 8000
```

El Gateway debe iniciarse después de los demás servicios, ya que es el
punto de entrada principal y se encarga de derivar las solicitudes hacia
ellos.

Una vez iniciados correctamente, las aplicaciones quedan disponibles en
sus respectivos puertos.

## 4.5. Pruebas del backend mediante solicitudes HTTP

Para comprobar el funcionamiento del backend se pueden utilizar
solicitudes HTTP mediante `curl.exe` desde PowerShell.

La documentación interactiva de FastAPI también se encuentra disponible
en las siguientes direcciones:

  -----------------------------------------------------------------------
  Servicio                            Documentación
  ----------------------------------- -----------------------------------
  Gateway                             <http://127.0.0.1:8000/docs>

  Auth Service                        <http://127.0.0.1:8100/docs>

  Clients API                         <http://127.0.0.1:9000/docs>

  Admin API                           <http://127.0.0.1:9100/docs>
  -----------------------------------------------------------------------

Se recomienda utilizar principalmente la documentación del Gateway, ya
que representa el punto de entrada previsto para las solicitudes
externas.

### A. Comprobar el acceso público

Consultar los productos disponibles:

``` powershell
curl.exe -X GET "http://127.0.0.1:8000/api/products"
```

Resultado esperado: HTTP 200 y un listado de productos almacenados en
MongoDB.

### B. Comprobar el inicio de sesión

Para iniciar sesión se debe utilizar una cuenta previamente registrada:

``` powershell
curl.exe -X POST "http://127.0.0.1:8000/api/login" -H "Content-Type: application/json" -c cliente.txt -d '{"email":"CORREO_CLIENTE","password":"CONTRASEÑA"}'
```

La opción `-c cliente.txt` permite guardar la cookie de sesión recibida
para utilizarla en las siguientes solicitudes.

### C. Consultar la sesión

``` powershell
curl.exe -X POST "http://127.0.0.1:8000/api/introspect" -b cliente.txt
```

Resultado esperado: información de la sesión activa, incluyendo el
identificador y rol del usuario.

### D. Consultar el perfil del usuario

``` powershell
curl.exe -X GET "http://127.0.0.1:8000/api/users/me" -b cliente.txt
```

Resultado esperado: información del usuario autenticado.

### E. Consultar pedidos del usuario

``` powershell
curl.exe -X GET "http://127.0.0.1:8000/api/orders/me" -b cliente.txt
```

Resultado esperado: listado de pedidos asociados al usuario autenticado.

### F. Comprobar el acceso administrativo

Para estas pruebas se debe iniciar sesión con una cuenta que tenga el
rol de administrador:

``` powershell
curl.exe -X POST "http://127.0.0.1:8000/api/login" -H "Content-Type: application/json" -c admin.txt -d '{"email":"CORREO_ADMIN","password":"CONTRASEÑA"}'
```

Consultar los pedidos:

``` powershell
curl.exe -X GET "http://127.0.0.1:8000/api/admin/orders" -b admin.txt
```

Consultar las solicitudes pendientes:

``` powershell
curl.exe -X GET "http://127.0.0.1:8000/api/admin/solicitudes" -b admin.txt
```

Consultar las ganancias:

``` powershell
curl.exe -X GET "http://127.0.0.1:8000/api/admin/ganancias" -b admin.txt
```

### G. Comprobar la protección de los microservicios

Los microservicios no deben aceptar solicitudes directas que no incluyan
el secreto interno enviado por el Gateway.

Se puede comprobar intentando acceder directamente a Clients:

``` powershell
curl.exe -X GET "http://127.0.0.1:9000/products"
```

Y a Admin:

``` powershell
curl.exe -X GET "http://127.0.0.1:9100/admin/orders"
```

### H. Comprobar el control de acceso administrativo

Iniciando sesión con una cuenta de cliente, intentar consultar los
pedidos administrativos:

``` powershell
curl.exe -X GET "http://127.0.0.1:8000/api/admin/orders" -b cliente.txt
```

### I. Comprobar el cierre de sesión

``` powershell
curl.exe -X POST "http://127.0.0.1:8000/api/logout" -b admin.txt -c admin.txt
```

Posteriormente, intentar consultar nuevamente un recurso privado:

``` powershell
curl.exe -X GET "http://127.0.0.1:8000/api/admin/orders" -b admin.txt
```

## 4.6. Consideraciones

-   Los servicios deben permanecer ejecutándose simultáneamente durante
    las pruebas.
-   Las solicitudes externas deben realizarse a través del Gateway,
    utilizando el puerto 8000.
-   Los accesos directos a los microservicios están restringidos
    mediante el secreto interno administrado por Vault.
-   Para probar las funcionalidades administrativas se requiere una
    cuenta previamente registrada con el rol correspondiente.
-   Para las pruebas de pedidos y solicitudes es necesario contar con
    productos y usuarios previamente registrados en MongoDB.

------------------------------------------------------------------------

**Disclaimer:** La sección 4 fue creada utilizando la Inteligencia
Artificial ChatGPT para facilitar comandos y una guía clara y
estructurada de cómo ejecutar cada servicio del proyecto. La información
fue revisada directamente por mí, se lo juro profe.
