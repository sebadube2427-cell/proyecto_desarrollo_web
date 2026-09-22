const api = [
    {
        nombre: "Ceviche",
        precio: 12990,
        imagen: "../img/productos/ceviche.jfif",
        categoria: "entrada",
        masvendido: true
    },
    {
        nombre: "Lomo saltado",
        precio: 13990,
        imagen: "../img/productos/lomo-saltado.jfif",
        categoria: "fondo",
        masvendido: true
    },
    {
        nombre: "Ají de gallina",
        precio: 11990,
        imagen: "../img/productos/aji-gallina.jfif",
        categoria: "fondo",
        masvendido: true
    },
    {
        nombre: "Anticuchos",
        precio: 9990,
        imagen: "../img/productos/anticucho.jfif",
        categoria: "entrada",
        masvendido: true
    },
    {
        nombre: "Arroz chaufa",
        precio: 10990,
        imagen: "../img/productos/chaufa.jfif",
        categoria: "fondo",
        masvendido: true
    },
    {
        nombre: "Causa limeña",
        precio: 8990,
        imagen: "../img/productos/limeña.jfif",
        categoria: "postre",
        masvendido: true
    }
];


/* =========================
   CARRUSEL
========================= */

const productosMasVendidos = api.filter(
    producto => producto.masvendido === true
);

const carrusel = document.querySelector(".productos-carrusel");

if (carrusel) {

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

        return tarjeta.offsetWidth + parseInt(estilo.gap);
    }


    if (botonDerecha) {

        botonDerecha.addEventListener("click", () => {

            carrusel.scrollBy({
                left: obtenerAnchoTarjeta(),
                behavior: "smooth"
            });

        });

    }
}


/* =========================
   PRODUCTOS DEL MENÚ
========================= */

const categorias = {
    entrada: document.getElementById("entradas"),
    fondo: document.getElementById("fondos"),
    bebestible: document.getElementById("bebestibles"),
    postre: document.getElementById("postres")
};

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
                onclick="irACuenta()"
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