const contenedorCarrito = document.querySelector(".carrito-productos");

const subtotalElemento = document.querySelector(
    ".resumen-linea span:last-child"
);

const totalElemento = document.querySelector(
    ".resumen-total span:last-child"
);


/* =========================
   LOCAL STORAGE
========================= */

function obtenerCarrito() {

    return JSON.parse(
        localStorage.getItem("carrito")
    ) || [];
}


function guardarCarrito(carrito) {

    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );
}


/* =========================
   FORMATO DE PRECIO
========================= */

function formatoPrecio(precio) {

    return `$${precio.toLocaleString("es-CL")}`;
}


/* =========================
   AGREGAR PRODUCTO
========================= */

function agregarAlCarrito(nombre) {

    const producto = api.find(
        producto => producto.nombre === nombre
    );

    if (!producto) return;


    const carrito = obtenerCarrito();


    const productoExistente = carrito.find(
        productoCarrito =>
            productoCarrito.nombre === nombre
    );


    if (productoExistente) {

        productoExistente.cantidad++;

    } else {

        carrito.push({

            nombre: producto.nombre,

            precio: producto.precio,

            imagen: producto.imagen,

            cantidad: 1

        });

    }


    guardarCarrito(carrito);

}


/* =========================
   MOSTRAR CARRITO
========================= */

function mostrarCarrito() {

    if (!contenedorCarrito) return;


    const carrito = obtenerCarrito();


    contenedorCarrito.innerHTML = "";


    if (carrito.length === 0) {

        contenedorCarrito.innerHTML = `
            <p class="carrito-vacio">
                Tu carrito está vacío.
            </p>
        `;

        actualizarResumen(0);

        return;
    }


    carrito.forEach((producto, indice) => {

        const tarjeta = document.createElement("div");

        tarjeta.classList.add("carrito-producto");


        const subtotalProducto =
            producto.precio * producto.cantidad;


        tarjeta.innerHTML = `

            <img
                src="${producto.imagen}"
                alt="${producto.nombre}"
            >


            <div class="producto-info">

                <h2>
                    ${producto.nombre}
                </h2>

                <p>
                    ${formatoPrecio(producto.precio)}
                </p>


                <div class="cantidad">

                    <button
                        type="button"
                        onclick="cambiarCantidad(${indice}, -1)"
                    >
                        −
                    </button>


                    <span>
                        ${producto.cantidad}
                    </span>


                    <button
                        type="button"
                        onclick="cambiarCantidad(${indice}, 1)"
                    >
                        +
                    </button>

                </div>

            </div>


            <div class="producto-subtotal">

                <p>
                    ${formatoPrecio(subtotalProducto)}
                </p>


                <button
                    type="button"
                    onclick="eliminarProducto(${indice})"
                >
                    <i class="bi bi-trash"></i>
                </button>

            </div>

        `;


        contenedorCarrito.appendChild(tarjeta);

    });


    calcularTotal(carrito);
}


/* =========================
   CAMBIAR CANTIDAD
========================= */

function cambiarCantidad(indice, cambio) {

    const carrito = obtenerCarrito();


    if (!carrito[indice]) return;


    carrito[indice].cantidad += cambio;


    if (carrito[indice].cantidad <= 0) {

        carrito.splice(indice, 1);

    }


    guardarCarrito(carrito);

    mostrarCarrito();
}


/* =========================
   ELIMINAR PRODUCTO
========================= */

function eliminarProducto(indice) {

    const carrito = obtenerCarrito();


    if (!carrito[indice]) return;


    carrito.splice(indice, 1);


    guardarCarrito(carrito);

    mostrarCarrito();
}


/* =========================
   CALCULAR TOTAL
========================= */

function calcularTotal(carrito) {

    let subtotal = 0;


    carrito.forEach(producto => {

        subtotal +=
            producto.precio *
            producto.cantidad;

    });


    actualizarResumen(subtotal);
}


/* =========================
   ACTUALIZAR RESUMEN
========================= */

function actualizarResumen(subtotal) {

    if (subtotalElemento) {

        subtotalElemento.textContent =
            formatoPrecio(subtotal);

    }


    if (totalElemento) {

        totalElemento.textContent =
            formatoPrecio(subtotal);

    }
}


/* =========================
   REALIZAR PEDIDO
========================= */

const botonPedido =
    document.querySelector(".boton-pedido");


if (botonPedido) {

    botonPedido.addEventListener("click", () => {

        const carrito = obtenerCarrito();


        if (carrito.length === 0) {

            alert("Tu carrito está vacío.");

            return;
        }


        window.location.href =
            "pedido.html";

    });

}


/* =========================
   INICIALIZAR CARRITO
========================= */

mostrarCarrito();