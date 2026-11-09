
// ==========================================
// CONFIGURACIÓN
// ==========================================

const API_URL_ADMIN = "http://127.0.0.1:8000/api";

const CLAVES_ADMIN = {
    pedidos: "admin_pedidos",
    solicitudes: "admin_solicitudes",
    ganancias: "admin_ganancias",
    usuario: "admin_user_id"
};

// Ajusta estas rutas si tu estructura de carpetas es diferente.
const RUTAS_ADMIN = {
    login: "../html/login.html",
    perfil: "../html/perfil.html"
};


// ==========================================
// CONSULTAS AL BACKEND
// ==========================================

async function consultarAdmin(endpoint, clave) {

    const respuesta = await fetch(`${API_URL_ADMIN}${endpoint}`, {
        method: "GET",
        credentials: "include"
    });

    if (respuesta.status === 401 || respuesta.status === 403) {
        sessionStorage.clear();
        window.location.replace(RUTAS_ADMIN.login);

        throw new Error("La sesión ha expirado o no tienes autorización.");
    }

    if (!respuesta.ok) {
        throw new Error(
            `Error al consultar ${endpoint}: ${respuesta.status}`
        );
    }

    const datos = await respuesta.json();

    sessionStorage.setItem(clave, JSON.stringify(datos));

    return datos;
}


// Obtener los últimos 50 pedidos
async function cargarPedidosAdmin() {
    return consultarAdmin(
        "/admin/orders",
        CLAVES_ADMIN.pedidos
    );
}


// Obtener las últimas 25 solicitudes pendientes
async function cargarSolicitudesAdmin() {
    return consultarAdmin(
        "/admin/solicitudes",
        CLAVES_ADMIN.solicitudes
    );
}


// Obtener las ganancias de los últimos 30 días
async function cargarGananciasAdmin() {
    return consultarAdmin(
        "/admin/ganancias",
        CLAVES_ADMIN.ganancias
    );
}


// ==========================================
// CARGA Y REUTILIZACIÓN DE DATOS
// ==========================================

async function cargarDatosAdmin() {

    const consultas = [];

    // Comprobar qué información falta en sessionStorage
    if (!sessionStorage.getItem(CLAVES_ADMIN.pedidos)) {
        consultas.push(cargarPedidosAdmin());
    }

    if (!sessionStorage.getItem(CLAVES_ADMIN.solicitudes)) {
        consultas.push(cargarSolicitudesAdmin());
    }

    if (!sessionStorage.getItem(CLAVES_ADMIN.ganancias)) {
        consultas.push(cargarGananciasAdmin());
    }

    // Si ya tenemos todo, no hacemos nuevas consultas
    if (consultas.length === 0) {
        console.log("Datos administrativos recuperados desde sessionStorage.");
        return;
    }

    // Ejecutar únicamente las consultas necesarias
    await Promise.all(consultas);

    console.log("Datos administrativos cargados correctamente.");
}


// ==========================================
// VERIFICACIÓN DE SESIÓN Y ROL
// ==========================================

async function verificarSesionAdmin() {

    try {

        console.log("Verificando sesión administrativa...");

        const respuesta = await fetch(`${API_URL_ADMIN}/introspect`, {
            method: "POST",
            credentials: "include"
        });

        console.log("Estado HTTP introspect:", respuesta.status);

        const texto = await respuesta.text();

        console.log("Respuesta original introspect:", texto);

        const sesion = JSON.parse(texto);

        console.log("Sesión recibida:", sesion);
        console.log("¿Sesión activa?:", sesion.active);
        console.log("Rol recibido:", sesion.rol);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP ${respuesta.status}`);
        }

        if (!sesion.active) {
            console.error("El backend indica que la sesión no está activa.");
            return false;
        }

        if (sesion.rol !== "admin") {
            console.error("El usuario no tiene rol admin:", sesion.rol);
            return false;
        }

        console.log("Sesión administrativa validada correctamente.");

        return true;

    } catch (error) {

        console.error("Error verificando sesión:", error);

        return false;
    }
}


// ==========================================
// NAVBAR ADMINISTRATIVO
// ==========================================

function mostrarNavbarAdmin() {

    const contenedor = document.getElementById("admin_navbar");

    if (!contenedor) return;

    const paginaActual = window.location.pathname.split("/").pop();

    contenedor.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-dark navbar-admin">
            <div class="container-fluid">

                <a class="navbar-brand" href="index.html">
                    Panel administrativo
                </a>

                <button
                    class="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarAdmin"
                    aria-controls="navbarAdmin"
                    aria-expanded="false"
                    aria-label="Mostrar navegación"
                >
                    <span class="navbar-toggler-icon"></span>
                </button>

                <div class="collapse navbar-collapse" id="navbarAdmin">

                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">

                        <li class="nav-item">
                            <a class="nav-link ${paginaActual === "index.html" ? "active" : ""}"
                               href="index.html">
                                Dashboard
                            </a>
                        </li>

                        <li class="nav-item">
                            <a class="nav-link ${paginaActual === "productos.html" ? "active" : ""}"
                               href="productos.html">
                                Productos
                            </a>
                        </li>

                        <li class="nav-item">
                            <a class="nav-link ${paginaActual === "../html/index.html" ? "active" : ""}"
                               href="../html/index.html">
                                tienda principal
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </nav>
    `;
}

// ==========================================
// RESUMEN DEL DASHBOARD
// ==========================================

function mostrarResumenDashboard() {

    const contenedor = document.getElementById("resumenDashboard");

    // Si estamos en otra página administrativa, no hacemos nada
    if (!contenedor) return;

    // Recuperar información desde sessionStorage
    const pedidos = JSON.parse(
        sessionStorage.getItem(CLAVES_ADMIN.pedidos) || "[]"
    );

    const solicitudes = JSON.parse(
        sessionStorage.getItem(CLAVES_ADMIN.solicitudes) || "[]"
    );

    const datosGanancias = JSON.parse(
        sessionStorage.getItem(CLAVES_ADMIN.ganancias) || "{}"
    );

    // Calcular cantidad de pedidos según su estado
    const pedidosPreparacion = pedidos.filter(
        pedido => pedido.estado === "preparacion"
    ).length;

    const pedidosPendientes = pedidos.filter(
        pedido => pedido.estado === "pendiente"
    ).length;

    const solicitudesPendientes = solicitudes.length;

    const ganancias = datosGanancias.ganancias || 0;

    // Formatear ganancias como moneda chilena
    const gananciasFormateadas = new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(ganancias);

    // Crear tarjetas
    contenedor.innerHTML = `
        <div class="dashboard-grid">

            <div class="card dashboard-card">
                <div class="card-body">
                    <h6 class="dashboard-card-title">Ganancias del mes</h6>
                    <h3 class="dashboard-value">${gananciasFormateadas}</h3>
                    <p class="text-muted mb-0">Últimos 30 días</p>
                </div>
            </div>

            <div class="card dashboard-card">
                <div class="card-body">
                    <h6 class="dashboard-card-title">Pedidos en preparación</h6>
                    <h3 class="dashboard-value">${pedidosPreparacion}</h3>
                </div>
            </div>

            <div class="card dashboard-card">
                <div class="card-body">
                    <h6 class="dashboard-card-title">Pedidos pendientes</h6>
                    <h3 class="dashboard-value">${pedidosPendientes}</h3>
                </div>
            </div>

            <div class="card dashboard-card">
                <div class="card-body">
                    <h6 class="dashboard-card-title">Solicitudes pendientes</h6>
                    <h3 class="dashboard-value">${solicitudesPendientes}</h3>
                </div>
            </div>

        </div>
    `;
}


// Mostrar pedidos pendientes de pago
function mostrarPedidosPendientesPago() {

    const contenedor = document.getElementById("pedidos_pendientes_pago");

    if (!contenedor) return;

    const pedidos = JSON.parse(
        sessionStorage.getItem(CLAVES_ADMIN.pedidos) || "[]"
    );

    // Filtrar pedidos pendientes
    const pedidosPendientes = pedidos.filter(
        pedido => pedido.estado === "pendiente"
    );

    contenedor.innerHTML = "";

    // Si no hay pedidos pendientes
    if (pedidosPendientes.length === 0) {

        contenedor.innerHTML = `
            <div class="col-12">
                <div class="alert alert-success">
                    No hay pedidos pendientes de pago.
                </div>
            </div>
        `;

        return;
    }

    // Crear una tarjeta por cada pedido
    pedidosPendientes.forEach(pedido => {

        const productosHTML = pedido.productos.map(producto => `
            <li class="list-group-item d-flex justify-content-between">
                <span>
                    ${producto.nombre} x${producto.cantidad}
                </span>
                <span>
                    ${formatearMoneda(producto.precio * producto.cantidad)}
                </span>
            </li>
        `).join("");

        const fecha = pedido.fecha
            ? new Date(pedido.fecha).toLocaleString("es-CL")
            : "Sin fecha";

        const tarjeta = document.createElement("div");

        tarjeta.className = "col-12 col-lg-6";

        tarjeta.innerHTML = `
            <div class="card h-100 shadow-sm">

                <div class="card-header d-flex justify-content-between align-items-center">
                    <strong>Pedido #${pedido._id.slice(-6)}</strong>
                    <span class="badge bg-warning text-dark">
                        Pendiente de pago
                    </span>
                </div>

                <div class="card-body">

                    <p class="mb-2">
                        <strong>Fecha:</strong> ${fecha}
                    </p>

                    <p class="mb-2">
                        <strong>Dirección:</strong>
                        ${pedido.direccion || "No especificada"}
                    </p>

                    <p class="mb-2">
                        <strong>Observación:</strong>
                        ${pedido.observacion || "Sin observaciones"}
                    </p>

                    <hr>

                    <h6>Productos</h6>

                    <ul class="list-group mb-3">
                        ${productosHTML}
                    </ul>

                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <strong>Total del pedido:</strong>
                        <strong class="fs-5">
                            ${formatearMoneda(pedido.total)}
                        </strong>
                    </div>

                    <button
                        class="btn btn-success w-100"
                        onclick="confirmarPagoPedido('${pedido._id}', this)"
                    >
                        <i class="bi bi-check-circle me-2"></i>
                        Confirmar pago
                    </button>

                </div>
            </div>
        `;

        contenedor.appendChild(tarjeta);
    });
}


// Formatear valores como pesos chilenos
function formatearMoneda(valor) {

    return new Intl.NumberFormat("es-CL", {
        style: "currency",
        currency: "CLP",
        maximumFractionDigits: 0
    }).format(valor || 0);
}

async function confirmarPagoPedido(pedidoId, boton) {

    const confirmar = confirm(
        "¿Estás seguro de que deseas confirmar el pago de este pedido?"
    );

    if (!confirmar) return;

    try {

        boton.disabled = true;
        boton.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Confirmando...
        `;

        const respuesta = await fetch(
            `${API_URL_ADMIN}/admin/orders/${pedidoId}`,
            {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    estado: "pagado"
                })
            }
        );

        const resultado = await respuesta.json();

        if (respuesta.status === 401 || respuesta.status === 403) {
            sessionStorage.clear();
            window.location.replace(RUTAS_ADMIN.login);
            return;
        }

        if (!respuesta.ok) {
            throw new Error(
                resultado.detail || "No se pudo confirmar el pago."
            );
        }

        // Recuperar pedidos guardados
        const pedidos = JSON.parse(
            sessionStorage.getItem(CLAVES_ADMIN.pedidos) || "[]"
        );

        // Actualizar el estado del pedido correspondiente
        const pedido = pedidos.find(
            pedido => pedido._id === pedidoId
        );

        if (pedido) {
            pedido.estado = "pagado";
        }

        // Guardar nuevamente los pedidos
        sessionStorage.setItem(
            CLAVES_ADMIN.pedidos,
            JSON.stringify(pedidos)
        );

        // Actualizar ganancias desde el backend
        sessionStorage.removeItem(CLAVES_ADMIN.ganancias);
        await cargarGananciasAdmin();

        // Volver a mostrar las secciones actualizadas
        mostrarPedidosPendientesPago();
        mostrarResumenDashboard();

        alert("El pago se confirmó correctamente.");

    } catch (error) {

        console.error("Error al confirmar el pago:", error);

        alert(error.message || "Ocurrió un error al confirmar el pago.");

        boton.disabled = false;
        boton.innerHTML = `
            <i class="bi bi-check-circle me-2"></i>
            Confirmar pago
        `;
    }
}

document.addEventListener("DOMContentLoaded", async () => {

    try {

        const sesionValida = await verificarSesionAdmin();

        if (!sesionValida) {
            window.location.replace(RUTAS_ADMIN.login);
            return;
        }

        mostrarNavbarAdmin();

        await cargarDatosAdmin();

        mostrarResumenDashboard();

        mostrarPedidosPendientesPago();

    } catch (error) {

        console.error("Error al inicializar el panel:", error);

        alert("No fue posible cargar toda la información del panel administrativo.");
    }
});