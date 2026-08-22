const productos = [
    {
        nombre: "Aceite de motor",
        descripcion: "Aceite para mantenimiento del motor.",
        precio: 25000
    },
    {
        nombre: "Filtro de aceite",
        descripcion: "Filtro para distintos vehículos.",
        precio: 10000
    },
    {
        nombre: "Pastillas de freno",
        descripcion: "Pastillas para sistema de frenos.",
        precio: 35000
    },
    {
        nombre: "Bujías",
        descripcion: "Bujías para motores a gasolina.",
        precio: 18000
    },
    {
        nombre: "Filtro de aire",
        descripcion: "Filtro de aire para motor.",
        precio: 12000
    }
];


function crearNavbar() {

    document.getElementById("navbar").innerHTML = `

        <nav class="navbar navbar-expand-sm bg-dark navbar-dark">

            <div class="container-fluid">

                <a class="navbar-brand"
                   href="index.html">
                    MecánicaPro
                </a>

                <button class="navbar-toggler"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#menu">

                    <span class="navbar-toggler-icon"></span>

                </button>

                <div class="collapse navbar-collapse"
                     id="menu">

                    <ul class="navbar-nav">

                        <li class="nav-item">
                            <a class="nav-link"
                               href="index.html">
                                Inicio
                            </a>
                        </li>

                        <li class="nav-item">
                            <a class="nav-link"
                               href="productos.html">
                                Productos
                            </a>
                        </li>

                        <li class="nav-item">
                            <a class="nav-link"
                               href="servicios.html">
                                Servicios
                            </a>
                        </li>

                        <li class="nav-item">
                            <a class="nav-link"
                               href="contacto.html">
                                Contacto
                            </a>
                        </li>

                    </ul>

                </div>

            </div>

        </nav>
    `;
}


function crearFooter() {

    document.getElementById("footer").innerHTML = `

        <footer class="bg-dark text-white text-center p-4 mt-5">

            <p class="mb-0">
                MecánicaPro © 2026
            </p>

        </footer>
    `;
}


function crearProducto(producto) {

    return `

        <div class="col-12 col-md-4">

            <div class="card h-100">

                <div class="card-body">

                    <div class="bg-secondary"
                         style="height:120px">
                    </div>

                    <h4 class="mt-3">
                        ${producto.nombre}
                    </h4>

                    <p>
                        ${producto.descripcion}
                    </p>

                    <strong>
                        $${producto.precio.toLocaleString("es-CL")}
                    </strong>

                    <br>

                    <button class="btn btn-primary mt-2">
                        Ver producto
                    </button>

                </div>

            </div>

        </div>
    `;
}


function mostrarProductos() {

    const lista =
        document.getElementById("lista-productos");

    const destacados =
        document.getElementById("productos-destacados");


    if (lista) {

        lista.innerHTML =
            productos.map(crearProducto).join("");

    }


    if (destacados) {

        destacados.innerHTML =
            productos
                .slice(0, 3)
                .map(crearProducto)
                .join("");

    }
}


function formularioContacto() {

    const formulario =
        document.getElementById("contact-form");

    if (!formulario) return;


    formulario.addEventListener("submit", function(event) {

        event.preventDefault();

        document.getElementById("respuesta").innerHTML = `

            <div class="alert alert-success">
                Mensaje enviado correctamente.
            </div>

        `;

        formulario.reset();

    });
}


crearNavbar();
crearFooter();
mostrarProductos();
formularioContacto();