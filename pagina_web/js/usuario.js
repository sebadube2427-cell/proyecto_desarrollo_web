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

/* =========================
   REGISTRO
========================= */

const formularioRegistro =
    document.getElementById("formRegistro");

const mensajeRegistro =
    document.getElementById("mensajeRegistro");

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



/* =========================
   MENSAJES
========================= */

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

/* =========================
   LOGIN
========================= */


const formularioLogin =
    document.getElementById("formLogin");

const mensajeLogin =
    document.getElementById("mensajeLogin");


if (formularioLogin) {

    formularioLogin.addEventListener(
        "submit",
        async function (evento) {

            evento.preventDefault();

            const correo =
                document.getElementById("correo").value.trim();

            const contrasena =
                document.getElementById("contrasena").value;

            // Preparar datos para el backend
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
                    body: JSON.stringify(login)
                });

                const resultado = await respuesta.json();

                console.log("Respuesta del login:", resultado);

                if (!respuesta.ok) {
                    throw new Error(
                        resultado.detail || "No se pudo iniciar sesión."
                    );
                }

                // Guardar token de autenticación
                localStorage.setItem(
                    "access_token",
                    resultado.access_token
                );

                // Guardar información básica de la sesión
                const usuario = {
                    email: correo
                };

                localStorage.setItem(
                    "usuarioActual",
                    JSON.stringify(usuario)
                );

                mostrarMensajeLogin(
                    "Inicio de sesión correcto. Redirigiendo...",
                    false
                );

                setTimeout(() => {
                    window.location.href = "perfil.html";
                }, 1000);

            } catch (error) {

                mostrarMensajeLogin(error.message, true);

                console.error("Error en el login:", error);

            }

        }
    );

}


/* =========================
   MENSAJE LOGIN
========================= */

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


/* =========================
   IR A CUENTA
========================= */




/* =========================
   MOSTRAR PERFIL
========================= */








async function get_user_data() {
    await 

}
const cuenta =
    document.getElementById("usuario");

if (cuenta) {

    async function user_data (){

        evento.preventDefault();
    }
    
}