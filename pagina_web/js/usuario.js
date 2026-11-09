function validarRUN(run) {

    run = run
        .replace(/\./g, "")
        .replace(/-/g, "")
        .toUpperCase();


    if (!/^\d{7,8}[0-9K]$/.test(run)) {

        return false;

    }


    const cuerpo = run.slice(0, -1);

    const digitoVerificador =
        run.slice(-1);


    let suma = 0;

    let multiplicador = 2;


    for (let i = cuerpo.length - 1; i >= 0; i--) {

        suma +=
            parseInt(cuerpo[i]) *
            multiplicador;


        multiplicador++;


        if (multiplicador > 7) {

            multiplicador = 2;

        }

    }


    const resto = 11 - (suma % 11);


    let resultado;


    if (resto === 11) {

        resultado = "0";

    } else if (resto === 10) {

        resultado = "K";

    } else {

        resultado = resto.toString();

    }


    return resultado === digitoVerificador;
}

const API_URL_USERS = "http://127.0.0.1:8000/api";

//registro de un usuario nuevo

const formularioRegistro = document.getElementById("formRegistro");

const mensajeRegistro = document.getElementById("mensajeRegistro");

if (formularioRegistro) {

    formularioRegistro.addEventListener("submit", async function (evento) {

        evento.preventDefault();


        const run = document.getElementById("run").value.trim();
        const nombre = document.getElementById("nombre").value.trim();
        const direccion = document.getElementById("direccion").value.trim();
        const comuna = document.getElementById("comuna").value.trim();
        const provincia = document.getElementById("provincia").value.trim();
        const region = document.getElementById("region").value.trim();
        const fechaNacimiento = document.getElementById("fechaNacimiento").value;
        const sexo = document.getElementById("sexo").value;
        const correo = document.getElementById("correo").value.trim();
        const telefono = document.getElementById("telefono").value.trim();
        const contrasena = document.getElementById("contrasena").value;
        const confirmarContrasena =
            document.getElementById("confirmarContrasena").value;

        // Validar RUN
        if (!validarRUN(run)) {
            mostrarMensajeRegistro("El RUN ingresado no es válido.", true);
            return;
        }

        // Validar contraseñas
        if (contrasena !== confirmarContrasena) {
            mostrarMensajeRegistro("Las contraseñas no coinciden.", true);
            return;
        }

        // Normalizar RUN
        const runNormalizado = run
            .replace(/\./g, "")
            .replace(/-/g, "")
            .toUpperCase();

        // Preparar datos para el backend
        const nuevoUsuario = {
            rut: runNormalizado,
            nombre: nombre,
            direccion: direccion,
            comuna: comuna,
            provincia: provincia,
            region: region,
            fecha_nacimiento: fechaNacimiento,
            sexo: sexo,
            email: correo,
            numero: telefono,
            password: contrasena
        };

        try {

            const respuesta = await fetch(`${API_URL_USERS}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(nuevoUsuario)
            });

            const resultado = await respuesta.json();


            if (!respuesta.ok) {
                throw new Error(
                    resultado.detail || "No se pudo crear la cuenta."
                );
            }

            mostrarMensajeRegistro(
                "Registro exitoso. Redirigiendo al inicio de sesión...",
                false
            );

            formularioRegistro.reset();

            setTimeout(() => {
                window.location.href = "login.html";
            }, 1500);

        } catch (error) {

            mostrarMensajeRegistro(error.message, true);
            console.error("Error en el registro:", error);

        }

    });
}


function mostrarMensajeRegistro(
    mensaje,
    error
) {

    if (!mensajeRegistro) return;


    mensajeRegistro.textContent =
        mensaje;


    mensajeRegistro.style.color =
        error
            ? "var(--dark-wine)"
            : "var(--pine-teal)";
}

//la funcion que hace la solicitud de login en el backend


const formularioLogin = document.getElementById("formLogin");
const mensajeLogin = document.getElementById("mensajeLogin");

if (formularioLogin) {
    formularioLogin.addEventListener("submit", async function(evento) {
        evento.preventDefault();

        const correo = document.getElementById("correo").value.trim();
        const contrasena = document.getElementById("contrasena").value;

        const login = {
            email: correo,
            password: contrasena
        };

        try {
            const respuesta = await fetch(`${API_URL_USERS}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                credentials: "include",
                body: JSON.stringify(login)
            });

            const resultado = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(
                    resultado.detail || "No se pudo iniciar sesión."
                );
            }

            mostrarMensajeLogin(
                "Inicio de sesión correcto. Redirigiendo...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "perfil.html";
            }, 1000);

        } catch (error) {
            console.error("Error en login:", error);

            mostrarMensajeLogin(
                error.message || "Error al conectar con el servidor.",
                "danger"
            );
        }
    });
}


function mostrarMensajeLogin(
    mensaje,
    error
) {

    if (!mensajeLogin) return;


    mensajeLogin.textContent =
        mensaje;


    mensajeLogin.style.color =
        error
            ? "var(--dark-wine)"
            : "var(--pine-teal)";
}


//funcion que carga los datos de el usuario que ha iniciado sesion, se utiliza en perfil.html

const perfilUsuario = document.getElementById("perfilRun");

if (perfilUsuario) {

    const perfilGuardado = sessionStorage.getItem("perfilUsuario");

    if (perfilGuardado) {
        mostrarPerfil(JSON.parse(perfilGuardado));
    } else {
        cargarPerfil();
    }

}


//solamente muestra los datos del perfil
function mostrarPerfil(usuario) {
    document.getElementById("perfilRun").textContent = usuario.rut;
    document.getElementById("perfilNombre").textContent = usuario.nombre;
    document.getElementById("perfilDireccion").textContent = usuario.direccion;
    document.getElementById("perfilComuna").textContent = usuario.comuna;
    document.getElementById("perfilProvincia").textContent = usuario.provincia;
    document.getElementById("perfilRegion").textContent = usuario.region;
    document.getElementById("perfilFechaNacimiento").textContent = usuario.fecha_nacimiento;
    document.getElementById("perfilSexo").textContent = usuario.sexo;
    document.getElementById("perfilCorreo").textContent = usuario.email;
    document.getElementById("perfilTelefono").textContent = usuario.numero;

    document.documentElement.style.visibility = "visible";
}
//llama al backend para obtener los datos solamente la primera vez
async function cargarPerfil() {

    try {
        const respuesta = await fetch(`${API_URL_USERS}/users/me`, {
            method: "GET",
            credentials: "include"
        });

        if (respuesta.status === 401) {
            window.location.replace("login.html");
            return;
        }

        const usuario = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                usuario.detail || "No se pudo cargar el perfil."
            );
        }

        sessionStorage.setItem("perfilUsuario", JSON.stringify(usuario));

        mostrarPerfil(usuario);

    } catch (error) {

        console.error("Error al cargar el perfil:", error);
        document.documentElement.style.visibility = "visible";

    }
}

async function verificarRolAdmin() {
//esta funcion es para activar el boton que lleva a la pagina de admin, cuando el usuario que inicia sesion hace login es admin se activa
    const respuesta = await fetch("http://127.0.0.1:8000/api/introspect", {
        method: "POST",
        credentials: "include"
    });

    const sesion = await respuesta.json();

    if (sesion.active && sesion.rol === "admin") {
        document.getElementById("btn_admin").style.display = "inline-block";
    }
}
if (document.getElementById("btn_admin")) {
    verificarRolAdmin();
}


//funcion que permite actualizar los datos de un usuario
function actualizarDatos() {

    const usuario = JSON.parse(sessionStorage.getItem("perfilUsuario"));

    if (!usuario) {
        alert("No se encontraron los datos del usuario.");
        return;
    }

    // Evitar crear el formulario más de una vez
    if (document.getElementById("formularioActualizar")) return;

    const contenedor = document.createElement("div");
    contenedor.id = "formularioActualizar";

    contenedor.innerHTML = `
        <div class="formulario-datos">
            <h2>Actualizar mis datos</h2>

            <form id="formActualizarPerfil">

                <label>RUT</label>
                <input type="text" name="rut" value="${usuario.rut ?? ""}">

                <label>Nombre</label>
                <input type="text" name="nombre" value="${usuario.nombre ?? ""}">

                <label>Dirección</label>
                <input type="text" name="direccion" value="${usuario.direccion ?? ""}">

                <label>Comuna</label>
                <input type="text" name="comuna" value="${usuario.comuna ?? ""}">

                <label>Provincia</label>
                <input type="text" name="provincia" value="${usuario.provincia ?? ""}">

                <label>Región</label>
                <input type="text" name="region" value="${usuario.region ?? ""}">

                <label>Fecha de nacimiento</label>
                <input type="date" name="fecha_nacimiento" value="${usuario.fecha_nacimiento ?? ""}">

                <label>Sexo</label>
                <input type="text" name="sexo" value="${usuario.sexo ?? ""}">

                <label>Correo electrónico</label>
                <input type="email" name="email" value="${usuario.email ?? ""}">

                <label>Teléfono</label>
                <input type="text" name="numero" value="${usuario.numero ?? ""}">

                <button type="submit">Guardar cambios</button>
                <button type="button" id="cancelarActualizar">Cancelar</button>

            </form>
        </div>
    `;

    document.body.appendChild(contenedor);

    document.getElementById("cancelarActualizar").addEventListener("click", () => {
        contenedor.remove();
    });

    document.getElementById("formActualizarPerfil").addEventListener("submit", enviarActualizacion);
}

async function enviarActualizacion(event) {

    event.preventDefault();

    const usuarioActual = JSON.parse(sessionStorage.getItem("perfilUsuario"));

    const formulario = new FormData(event.target);

    const datos = {};

    for (const [campo, valor] of formulario.entries()) {

        // Ignorar campos vacíos
        if (valor.trim() === "") continue;

        // Enviar solamente los campos que cambiaron
        if (valor !== String(usuarioActual[campo] ?? "")) {
            datos[campo] = valor;
        }
    }

    if (Object.keys(datos).length === 0) {
        alert("No se realizaron cambios.");
        return;
    }

    try {

        const respuesta = await fetch(`${API_URL_USERS}/users/me`, {
            method: "PATCH",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

    if (respuesta.status === 401) {
        alert("No se pudieron modificar los datos.");
        return;
    }

        if (!respuesta.ok) {
            throw new Error(resultado.detail || "No se pudieron actualizar los datos.");
        }

        // Actualizar los datos almacenados
        const usuarioActualizado = {
            ...usuarioActual,
            ...datos
        };

        sessionStorage.setItem("perfilUsuario", JSON.stringify(usuarioActualizado));

        alert("Tus datos se actualizaron correctamente.");

        // Cerrar formulario y actualizar perfil
        document.getElementById("formularioActualizar").remove();

        mostrarPerfil(usuarioActualizado);

    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        alert(error.message);
    }
}


// cerrar sesion

async function cerrarSesion() {
    try {
        const respuesta = await fetch(`${API_URL_USERS}/logout`, {
            method: "POST",
            credentials: "include"
        });

        if (!respuesta.ok) {
            console.warn("El servidor no pudo procesar el cierre de sesión correctamente, pero se procederá locally.");
        }
    } catch (error) {
        // Capturamos cualquier error de red o del servidor
        console.error("Error de conexión al intentar cerrar sesión:", error);
    } finally {
        // El bloque `finally` se ejecuta SIEMPRE (haya éxito o error en el try/catch)
        sessionStorage.clear();
        window.location.href = "login.html";
    }
}
/*logica para llamar al endpoint que busca pedidos anteriores*/


const perfilPedidos = document.getElementById("mispedidos");

if (perfilPedidos) {
    cargarPedidos();
}

async function cargarPedidos() {

    try {
        const respuesta = await fetch(`${API_URL_USERS}/orders/me`, {
            method: "GET",
            credentials: "include"
        });

        if (respuesta.status === 401) {
            window.location.replace("login.html");
            return;
        }

        const pedidos = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                pedidos.detail || "No se pudieron cargar los pedidos."
            );
        }

        // Enviar los pedidos a ui.js
        tarjetaPedido(pedidos);

    } catch (error) {
        console.error("Error al cargar los pedidos:", error);
    }
}
//envia solicitudes al backend como un modulo de ayuda en linea. 
//el administrador debera leer las solicitudes y responder a ellas
async function enviarSolicitud(event) {
    event.preventDefault();

    const formulario = event.target;
    const boton = formulario.querySelector('button[type="submit"]');

    const solicitud = {
        tipo_solicitud: "contacto",
        tipo: formulario.tipo.value || null,
        fecha: formulario.fecha.value || null,
        personas: formulario.personas.value
            ? Number(formulario.personas.value)
            : null,
        mensaje: formulario.mensaje.value || null
    };

    boton.disabled = true;
    boton.textContent = "Enviando solicitud...";

    try {
        const respuesta = await fetch(`${API_URL_USERS}/solicitudes`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(solicitud)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.detail || "No se pudo enviar la solicitud.");
        }

        alert("¡Tu solicitud ha sido enviada correctamente!");
        formulario.reset();

    } catch (error) {
        console.error("Error al enviar la solicitud:", error);
        alert(error.message);

    } finally {
        boton.disabled = false;
        boton.textContent = "Enviar solicitud";
    }
}
const formularioContacto = document.querySelector(".contacto-form");

if (formularioContacto) {
    formularioContacto.addEventListener("submit", enviarSolicitud);
}



// funcion que envia solicitud de anulacion al backend, el administrador debe autorizar la cancelacion.
async function solicitarAnulacion(pedidoId) {

    const motivo = prompt("Indica el motivo por el que deseas anular tu compra:");

    if (!motivo || motivo.trim() === "") {
        alert("Debes ingresar un motivo para solicitar la anulación.");
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL_USERS}/solicitudes`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tipo_solicitud: "anulacion",
                pedido_id: pedidoId,
                motivo: motivo.trim()
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.detail || "No se pudo enviar la solicitud.");
        }

        alert("Solicitud de anulación enviada correctamente.");

    } catch (error) {
        console.error("Error al solicitar anulación:", error);
        alert(error.message);
    }
}