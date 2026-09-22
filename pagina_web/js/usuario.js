/* =========================
   USUARIOS
========================= */

function obtenerUsuarios() {

    return JSON.parse(
        localStorage.getItem("usuarios")
    ) || [];
}


function guardarUsuarios(usuarios) {

    localStorage.setItem(
        "usuarios",
        JSON.stringify(usuarios)
    );
}


/* =========================
   SESIÓN ACTUAL
========================= */

function obtenerUsuarioActual() {

    return JSON.parse(
        localStorage.getItem("usuarioActual")
    );
}


function guardarUsuarioActual(usuario) {

    localStorage.setItem(
        "usuarioActual",
        JSON.stringify(usuario)
    );
}


/* =========================
   VALIDAR RUN
========================= */

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


/* =========================
   REGISTRO
========================= */

const formularioRegistro =
    document.getElementById("formRegistro");

const mensajeRegistro =
    document.getElementById("mensajeRegistro");


if (formularioRegistro) {

    formularioRegistro.addEventListener(
        "submit",
        function (evento) {

            evento.preventDefault();


            const run =
                document.getElementById("run").value.trim();

            const nombre =
                document.getElementById("nombre").value.trim();

            const direccion =
                document.getElementById("direccion").value.trim();

            const comuna =
                document.getElementById("comuna").value.trim();

            const provincia =
                document.getElementById("provincia").value.trim();

            const region =
                document.getElementById("region").value.trim();

            const fechaNacimiento =
                document.getElementById("fechaNacimiento").value;

            const sexo =
                document.getElementById("sexo").value;

            const correo =
                document.getElementById("correo").value.trim();

            const telefono =
                document.getElementById("telefono").value.trim();

            const contrasena =
                document.getElementById("contrasena").value;

            const confirmarContrasena =
                document.getElementById("confirmarContrasena").value;


            if (!validarRUN(run)) {

                mostrarMensajeRegistro(
                    "El RUN ingresado no es válido.",
                    true
                );

                return;
            }


            if (contrasena !== confirmarContrasena) {

                mostrarMensajeRegistro(
                    "Las contraseñas no coinciden.",
                    true
                );

                return;
            }


            const usuarios = obtenerUsuarios();


            const correoExiste =
                usuarios.some(
                    usuario =>
                        usuario.correo.toLowerCase() ===
                        correo.toLowerCase()
                );


            if (correoExiste) {

                mostrarMensajeRegistro(
                    "Este correo ya está registrado.",
                    true
                );

                return;
            }


            const runNormalizado =
                run
                    .replace(/\./g, "")
                    .replace(/-/g, "")
                    .toUpperCase();


            const runExiste =
                usuarios.some(
                    usuario =>
                        usuario.run === runNormalizado
                );


            if (runExiste) {

                mostrarMensajeRegistro(
                    "Este RUN ya está registrado.",
                    true
                );

                return;
            }


            const nuevoUsuario = {

                run: runNormalizado,

                nombre: nombre,

                direccion: direccion,

                comuna: comuna,

                provincia: provincia,

                region: region,

                fechaNacimiento:
                    fechaNacimiento,

                sexo: sexo,

                correo: correo,

                telefono: telefono,

                contrasena: contrasena

            };


            usuarios.push(nuevoUsuario);


            guardarUsuarios(usuarios);


            mostrarMensajeRegistro(
                "Registro exitoso. Redirigiendo al inicio de sesión...",
                false
            );


            formularioRegistro.reset();


            setTimeout(() => {

                window.location.href =
                    "login.html";

            }, 1500);

        }
    );

}


/* =========================
   MENSAJE REGISTRO
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
        function (evento) {

            evento.preventDefault();


            const correo =
                document.getElementById("correo")
                    .value
                    .trim();


            const contrasena =
                document.getElementById("contrasena")
                    .value;


            const usuarios =
                obtenerUsuarios();


            const usuario =
                usuarios.find(
                    usuario =>
                        usuario.correo.toLowerCase() ===
                        correo.toLowerCase() &&
                        usuario.contrasena ===
                        contrasena
                );


            if (!usuario) {

                mostrarMensajeLogin(
                    "El correo o la contraseña son incorrectos.",
                    true
                );

                return;
            }


            guardarUsuarioActual(usuario);


            mostrarMensajeLogin(
                "Inicio de sesión correcto. Redirigiendo...",
                false
            );


            setTimeout(() => {

                window.location.href =
                    "perfil.html";

            }, 1000);

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

function irACuenta() {

    const usuario =
        obtenerUsuarioActual();


    if (usuario) {

        window.location.href =
            "perfil.html";

    } else {

        window.location.href =
            "login.html";

    }
}


/* =========================
   MOSTRAR PERFIL
========================= */

function mostrarPerfil() {

    const usuario =
        obtenerUsuarioActual();


    if (!usuario) {

        window.location.href =
            "login.html";

        return;
    }


    const perfilRun =
        document.getElementById("perfilRun");

    const perfilNombre =
        document.getElementById("perfilNombre");

    const perfilDireccion =
        document.getElementById("perfilDireccion");

    const perfilComuna =
        document.getElementById("perfilComuna");

    const perfilProvincia =
        document.getElementById("perfilProvincia");

    const perfilRegion =
        document.getElementById("perfilRegion");

    const perfilFechaNacimiento =
        document.getElementById("perfilFechaNacimiento");

    const perfilSexo =
        document.getElementById("perfilSexo");

    const perfilCorreo =
        document.getElementById("perfilCorreo");

    const perfilTelefono =
        document.getElementById("perfilTelefono");


    if (perfilRun) {

        perfilRun.textContent =
            usuario.run;

    }


    if (perfilNombre) {

        perfilNombre.textContent =
            usuario.nombre;

    }


    if (perfilDireccion) {

        perfilDireccion.textContent =
            usuario.direccion;

    }


    if (perfilComuna) {

        perfilComuna.textContent =
            usuario.comuna;

    }


    if (perfilProvincia) {

        perfilProvincia.textContent =
            usuario.provincia;

    }


    if (perfilRegion) {

        perfilRegion.textContent =
            usuario.region;

    }


    if (perfilFechaNacimiento) {

        perfilFechaNacimiento.textContent =
            usuario.fechaNacimiento;

    }


    if (perfilSexo) {

        perfilSexo.textContent =
            usuario.sexo;

    }


    if (perfilCorreo) {

        perfilCorreo.textContent =
            usuario.correo;

    }


    if (perfilTelefono) {

        perfilTelefono.textContent =
            usuario.telefono;

    }
}


/* =========================
   CERRAR SESIÓN
========================= */

function cerrarSesion() {

    localStorage.removeItem(
        "usuarioActual"
    );


    window.location.href =
        "login.html";
}


/* =========================
   INICIALIZAR PERFIL
========================= */

if (
    document.getElementById("perfilRun")
) {

    mostrarPerfil();

}