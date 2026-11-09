let api = [];
/* llamada hacia el backend*/

const API_URL = "http://127.0.0.1:8000/api/products";
async function cargarProductos() {
    try {
        const productosGuardados = sessionStorage.getItem("productos");

        if (productosGuardados) {
            api = JSON.parse(productosGuardados);
        } else {
            const respuesta = await fetch(API_URL);

            if (!respuesta.ok) {
                throw new Error(`Error HTTP: ${respuesta.status}`);
            }

            api = await respuesta.json();

            sessionStorage.setItem("productos", JSON.stringify(api));
        }

        renderizarProductos();

    } catch (error) {
        console.error("Error al cargar los productos:", error);
    }
}




function renderizarProductos() {
    renderizarCarrusel(api);
    renderizarMenu(api);
}


function renderizarCarrusel(productos) {
    const productosMasVendidos = productos.filter(
        producto => producto.masvendidos === true
    );
    const carrusel = document.querySelector(".productos-carrusel");

    if (!carrusel) return;

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

    const botonDerecha = document.querySelector(".carrusel-btn.derecha");

    const botonIzquierda = document.querySelector(".carrusel-btn.izquierda");
    function obtenerAnchoTarjeta() {
        const tarjeta = carrusel.querySelector(".producto-card");

        if (!tarjeta) return 0;

        const estilo = getComputedStyle(carrusel);
        const gap = parseFloat(estilo.gap) || 0;

        return tarjeta.offsetWidth + gap;
    }

    if (botonDerecha) {
        botonDerecha.addEventListener("click", () => {
            console.log("Click derecha");
            carrusel.scrollBy({
                left: obtenerAnchoTarjeta(),
                behavior: "smooth"
            });
        });
    }

    if (botonIzquierda) {
        botonIzquierda.addEventListener("click", () => {
            console.log("Click izquierda");
            carrusel.scrollBy({
                left: -obtenerAnchoTarjeta(),
                behavior: "smooth"
            });
        });
    }
}



function renderizarMenu(productos) {
    const categorias = {
        entrada: document.getElementById("entradas"),
        fondo: document.getElementById("fondos"),
        bebestible: document.getElementById("bebestibles"),
        postre: document.getElementById("postres")
    };

    Object.values(categorias).forEach(contenedor => {
        if (contenedor) {
            contenedor.innerHTML = "";
        }
    });

    productos.forEach(producto => {
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
                onclick="agregarAlCarrito('${producto._id}')"
            >
                Agregar al carrito
            </button>
        `;

        contenedor.appendChild(tarjeta);
    });
}





//funcion que crea el navbar en el html para todas las paginas

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
                onclick="window.location.href='perfil.html'"
                class="nav-button"
            >
                👤
            </button>

        </nav>
    `;
}


//funcion que crea el footer en todas las paginas

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

                    <a href="contacto.html">Contacto y reservas</a>


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


//crea tarjetas que muestran pedidos pasados para la pagina mispedidos
function tarjetaPedido(pedidos) {
    const contenedor = document.getElementById("mispedidos");
    if (!contenedor) return;

    // Si el usuario no tiene pedidos
    if (pedidos.length === 0) {
        contenedor.innerHTML = `
            <main class="mis-pedidos">
                <section class="mispedidos-header">
                    <h1>Mis pedidos</h1>
                    <p>Revisa el historial de tus pedidos.</p>
                </section>

                <p>Aún no tienes pedidos realizados.</p>
            </main>
        `;
        return;
    }

    // crea una tarjeta por cada pedido
    const tarjetas = pedidos.map(pedido => {

        const fecha = new Date(pedido.fecha).toLocaleDateString("es-CL");

        const total = Number(pedido.total).toLocaleString("es-CL", {
            style: "currency",
            currency: "CLP",
            maximumFractionDigits: 0
        });

        // crea el HTML para cada producto del pedido
        const productosHTML = pedido.productos.map(producto => {
            const precio = Number(producto.precio).toLocaleString("es-CL", {
                style: "currency",
                currency: "CLP",
                maximumFractionDigits: 0
            });

            return `
                <div class="producto-pedido">
                    <p>${producto.nombre}</p>
                    <p>Cantidad: ${producto.cantidad}</p>
                    <p>Precio unitario: ${precio}</p>
                </div>
            `;
        }).join("");

        return `
            <article class="pedido-card">

                <div>
                    <p>Pedido #${pedido._id}</p>
                    <p>Fecha: ${fecha}</p>
                </div>

                <div>
                    <p><strong>Productos:</strong></p>
                    ${productosHTML}
                </div>

                <div>
                    <p>Comentarios: ${pedido.observacion || "Sin comentarios"}</p>
                </div>

                <div>
                    <p>Total: ${total}</p>
                    <p>Estado: ${pedido.estado}</p>
                </div>

                <div>
                    <p>Dirección: ${pedido.direccion || "No especificada"}</p>


                </div>

                <button
                    type="button"
                    id="cancelar-pedido"
                    data-id="${pedido._id}"
                >
                    Solicitar anulación
                </button>

            </article>
        `;
    }).join("");

    // Insertar todas las tarjetas en el HTML 
    contenedor.innerHTML = `
        <main class="mis-pedidos">

            <section class="mispedidos-header">
                <h1>Mis pedidos</h1>
                <p>Revisa el historial de tus pedidos.</p>
            </section>

            <section class="lista-pedidos">
                ${tarjetas}
            </section>

        </main>
    `;
}
//listener para el oton de cancelar pedido llamam a la funcion que solicita una anulacion en usuarios.js
document.addEventListener("click", function(event) {
    const boton = event.target.closest("#cancelar-pedido");

    if (boton) {
        const pedidoId = boton.dataset.id;
        solicitarAnulacion(pedidoId);
    }
});


//muestra un detalle del pedido antes de confirmarlo y proceder a pagar
function mostrarPedido(usuario, carrito) {
    const contenedor = document.getElementById("contenidoPedido");
    if (!contenedor) return;

    // Genera el HTML para los productos del carrito
    const productosHTML = carrito.map(producto => {
        const subtotal = producto.precio * producto.cantidad;

        return `
            <div class="pedido-producto">
                <span>${producto.nombre} x${producto.cantidad}</span>
                <span>${formatoPrecio(subtotal)}</span>
            </div>
        `;
    }).join("");

    // calcula el total
    const total = carrito.reduce((suma, producto) => {
        return suma + producto.precio * producto.cantidad;
    }, 0);

    // muestra datos del usuario y productos
    contenedor.innerHTML = `
        <div class="pedido-datos">
            <h2>Datos de entrega</h2>
            <p><strong>Nombre:</strong> ${usuario.nombre}</p>
            <p><strong>Dirección:</strong> ${usuario.direccion}</p>
            <p><strong>Comuna:</strong> ${usuario.comuna}</p>
            <p><strong>Provincia:</strong> ${usuario.provincia}</p>
            <p><strong>Región:</strong> ${usuario.region}</p>
            <p><strong>Teléfono:</strong> ${usuario.numero}</p>
            <a href="perfil.html">Modificar datos</a>
        </div>

        <div class="pedido-productos">
            <h2>Productos</h2>
            ${productosHTML}
            <hr>
            <div class="pedido-total">
                <strong>Total</strong>
                <strong>${formatoPrecio(total)}</strong>
            </div>
        </div>

        <div class="pedido-pago">
            <h2>Confirmar pedido</h2>
            <button type="button" id="confirmarPedido">
                Confirmar pedido
            </button>
        </div>
    `;
}

//funcion para reservas

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



crearNavbar();
crearFooter();
tarjetaPedido();
document.addEventListener("DOMContentLoaded", cargarProductos);