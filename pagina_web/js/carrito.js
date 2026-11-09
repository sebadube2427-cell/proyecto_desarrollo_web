const contenedorCarrito = document.querySelector(".carrito-productos");

const subtotalElemento = document.querySelector(
    ".resumen-linea span:last-child"
);

const totalElemento = document.querySelector(
    ".resumen-total span:last-child"
);


//el carrito se guarda en local storage hasta confirmar un pedido, despues es eliminado
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



function formatoPrecio(precio) {

    return `$${precio.toLocaleString("es-CL")}`;
}



function agregarAlCarrito(productoId) {

    const productosGuardados = sessionStorage.getItem("productos");

    if (!productosGuardados) return;

    const productos = JSON.parse(productosGuardados);

    const producto = productos.find(
        producto => producto._id === productoId
    );

    if (!producto) return;

    const carrito = obtenerCarrito();

    const productoExistente = carrito.find(
        productoCarrito =>
            productoCarrito.producto_id === producto._id
    );

    if (productoExistente) {

        productoExistente.cantidad++;

    } else {

        carrito.push({
            producto_id: producto._id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: 1
        });

    }

    guardarCarrito(carrito);
}



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

async function cargarDatosPedido() {

    const contenedor = document.getElementById("contenidoPedido");

    if (!contenedor) return;

    try {

        const carrito = obtenerCarrito();

        if (carrito.length === 0) {
            contenedor.innerHTML = "<p>Tu carrito está vacío.</p>";
            return;
        }

        const respuesta = await fetch("http://127.0.0.1:8000/api/users/me", {
            method: "GET",
            credentials: "include"
        });

        if (respuesta.status === 401) {
            window.location.replace("login.html");
            return;
        }

        const usuario = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(usuario.detail || "No se pudieron obtener los datos del usuario.");
        }

        mostrarPedido(usuario, carrito);

    } catch (error) {

        console.error("Error al cargar el pedido:", error);

        contenedor.innerHTML = `
            <p>No se pudo cargar la información del pedido.</p>
        `;
    }
}

cargarDatosPedido();


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



function eliminarProducto(indice) {

    const carrito = obtenerCarrito();


    if (!carrito[indice]) return;


    carrito.splice(indice, 1);


    guardarCarrito(carrito);

    mostrarCarrito();
}


//calcula el total desde el frontend para una previzualizacion, el total real se calcula en el backend
function calcularTotal(carrito) {

    let subtotal = 0;


    carrito.forEach(producto => {

        subtotal +=
            producto.precio *
            producto.cantidad;

    });


    actualizarResumen(subtotal);
}



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


//redirije desde carrito.html a pedido.html al apretar el boton de realizar pedido
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



// funcion que manda el pedido al backend
async function crearPedido() {
    const carrito = obtenerCarrito();

    if (carrito.length === 0) {
        alert("Tu carrito está vacío.");
        return;
    }

    const boton = document.getElementById("confirmarPedido");
    boton.disabled = true;
    boton.textContent = "Procesando pedido...";

    try {
        const respuesta = await fetch("http://127.0.0.1:8000/api/orders", {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                productos: carrito.map(producto => ({
                    producto_id: producto.producto_id,
                    cantidad: producto.cantidad
                }))
            })
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(resultado.detail || "No se pudo crear el pedido.");
        }

        // Pedido creado correctamente
        localStorage.removeItem("carrito");

        alert("¡Tu pedido se ha realizado correctamente!");

        window.location.href = "mispedidos.html";

    } catch (error) {
        console.error("Error al crear el pedido:", error);
        alert(error.message);

        boton.disabled = false;
        boton.textContent = "Confirmar pedido";
    }
}

// Escuchar el botón de confirmar pedido
document.addEventListener("click", function(event) {
    if (event.target.closest("#confirmarPedido")) {
        crearPedido();
    }
});




mostrarCarrito();