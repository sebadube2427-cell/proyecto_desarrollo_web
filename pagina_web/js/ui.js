let api = [];


/* =========================
   PRODUCTOS DESDE EL BACKEND
========================= */

const API_URL = "http://127.0.0.1:8000/api/products";

async function cargarProductos() {
    try {
        const respuesta = await fetch(API_URL);

        if (!respuesta.ok) {
            throw new Error(`Error HTTP: ${respuesta.status}`);
        }

        api = await respuesta.json();

        renderizarProductos();

    } catch (error) {
        console.error("Error al cargar los productos:", error);
    }
}


/* =========================
   MOSTRAR PRODUCTOS
========================= */

function renderizarProductos() {

    // CARRUSEL
    const productosMasVendidos = api.filter(
        producto => producto.masvendido === true
    );

    const carrusel = document.querySelector(".productos-carrusel");

    if (carrusel) {
        carrusel.innerHTML = "";

        productosMasVendidos.forEach(producto => {
            const tarjeta = document.createElement("div");

            tarjeta.classList.add("producto-card");

            tarjeta.innerHTML = `
                <img src="${producto.imagen}" alt="${producto.nombre}">
                <h3>${producto.nombre}</h3>
                <p>$${producto.precio.toLocaleString("es-CL")}</p>
            `;

            carrusel.appendChild(tarjeta);
        });

        const botonDerecha = document.querySelector(
            ".carrusel-btn.derecha"
        );

        function obtenerAnchoTarjeta() {
            const tarjeta = carrusel.querySelector(".producto-card");

            if (!tarjeta) return 0;

            const estilo = getComputedStyle(carrusel);
            const gap = parseFloat(estilo.gap) || 0;

            return tarjeta.offsetWidth + gap;
        }

        if (botonDerecha) {
            botonDerecha.onclick = () => {
                carrusel.scrollBy({
                    left: obtenerAnchoTarjeta(),
                    behavior: "smooth"
                });
            };
        }
    }


    // PRODUCTOS DEL MENÚ
    const categorias = {
        entrada: document.getElementById("entradas"),
        fondo: document.getElementById("fondos"),
        bebestible: document.getElementById("bebestibles"),
        postre: document.getElementById("postres")
    };

    // Limpiar los contenedores antes de agregar los productos
    Object.values(categorias).forEach(contenedor => {
        if (contenedor) {
            contenedor.innerHTML = "";
        }
    });

    api.forEach(producto => {
        const contenedor = categorias[producto.categoria];

        if (!contenedor) return;

        const tarjeta = document.createElement("div");

        tarjeta.classList.add("producto-card");

        tarjeta.innerHTML = `
            <img src="${producto.imagen}" alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p>$${producto.precio.toLocaleString("es-CL")}</p>

            <button
                type="button"
                onclick="agregarAlCarrito('${producto.nombre}')"
            >
                Agregar al carrito
            </button>
        `;

        contenedor.appendChild(tarjeta);
    });
}


// Iniciar la carga de productos
cargarProductos();


/* =========================
   NAVBAR
========================= */

function crearNavbar() {

    const navbar = document.getElementById("side_navbar");

    if (!navbar) return;

    navbar.innerHTML = `
        <nav class="side-navbar">

            <button
                onclick="window.location.href='index.html'"
                class="nav-button"
            >
                🏠
            </button>

            <button
                onclick="window.location.href='menu.html'"
                class="nav-button"
            >
                🍽️
            </button>

            <button
                onclick="window.location.href='carrito.html'"
                class="nav-button"
            >
                🛒
            </button>

            <button
                onclick="window.location.href='login.html'"
                class="nav-button"
            >
                👤
            </button>

        </nav>
    `;
}


/* =========================
   FOOTER
========================= */

function crearFooter() {

    const footer = document.getElementById("mifooter");

    if (!footer) return;

    footer.innerHTML = `
        <footer class="footer">

            <div class="footer-contenido">

                <div class="footer-columna">

                    <h3>Sabor Limeño</h3>

                    <p>
                        Comida peruana preparada con tradición y sabor.
                    </p>

                </div>


                <div class="footer-columna">

                    <h3>Navegación</h3>

                    <a href="index.html">Inicio</a>

                    <a href="menu.html">Menú</a>

                    <a href="contacto.html">Reservas</a>

                </div>


                <div class="footer-columna">

                    <h3>Contacto</h3>

                    <p>📍 Av. Concha y Toro 123</p>

                    <p>📞 +56 9 1234 5678</p>

                    <p>✉ contacto@saborlimeno.cl</p>

                </div>

            </div>


            <div class="footer-bottom">

                <p>
                    © 2026 Sabor Limeño.
                    Todos los derechos reservados.
                </p>

            </div>

        </footer>
    `;
}


/* =========================
   FECHA DE RESERVA
========================= */

const fecha = document.getElementById("fecha");

if (fecha) {

    const hoy = new Date();

    const fechaMin = new Date(hoy);
    fechaMin.setMonth(fechaMin.getMonth() - 2);

    const fechaMax = new Date(hoy);
    fechaMax.setMonth(fechaMax.getMonth() + 2);


    function formatoFecha(fecha) {

        const año = fecha.getFullYear();

        const mes = String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            fecha.getDate()
        ).padStart(2, "0");

        return `${año}-${mes}-${dia}`;
    }


    fecha.min = formatoFecha(fechaMin);
    fecha.max = formatoFecha(fechaMax);
}


/* =========================
   INICIALIZAR
========================= */

crearNavbar();
crearFooter();