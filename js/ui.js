
/*funcion para crear el menu principal en cada seccion de la pagina*/ 
function create_navbar() {

    const menu = document.getElementById("menu");

    if (!menu) {
        return;
    }

    menu.innerHTML = `

        <nav class="navbar navbar-expand-lg bg-dark navbar-dark">

            <div class="container">

                <!-- Nombre de la página -->
                <a class="navbar-brand fw-bold" href="index.html">
                    SkullMagicPerformance
                </a>


                <!-- Botón para celulares -->
                <button
                    class="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarContenido"
                    aria-controls="navbarContenido"
                    aria-expanded="false"
                    aria-label="Abrir navegación"
                >

                    <span class="navbar-toggler-icon"></span>

                </button>


                <!-- Contenido del menú -->
                <div
                    class="collapse navbar-collapse"
                    id="navbarContenido"
                >

                    <ul class="navbar-nav mx-auto">



                        <li class="nav-item">

                            <a
                                class="nav-link"
                                href="index.html"
                            >
                                inicio
                            </a>

                        </li>

                        <li class="nav-item">

                            <a
                                class="nav-link"
                                href="servicios.html"
                            >
                                servicios
                            </a>

                        </li>


                        <li class="nav-item">

                            <a
                                class="nav-link"
                                href="productos.html"
                            >
                                productos
                            </a>

                        </li>


                        <li class="nav-item">

                            <a
                                class="nav-link"
                                href="contacto.html"
                            >
                                nosotros
                            </a>

                        </li>

                    </ul>


                    <!-- Carrito -->
                    <a
                        href="carrito.html"
                        class="btn btn-outline-light"
                    >
                        🛒 Carrito
                    </a>

                </div>

            </div>

        </nav>
    `;
}

create_navbar();


const responseAPI = {
    "status": 200,
    "message": "Productos Obtenidos",
    "data": [
            {id:1,
             nombre:"filtro de aceite",
             descripcion:"filtros de aceite para vehiculos de carrera",
             img: "img/filtro aceite.png"
            },
            {id:2,
             nombre:"filtro de aire",
             descripcion:"filtro de aire de alto flujjo KyN",
             img: "img/filtro aire.png"
            },
            {id:3,
             nombre:"correa",
             descripcion:"correa de tesión de alta durabilidad",
             img: "img/correa distribucion.png"
            },
            {id:4,
             nombre:"bielas",
             descripcion:"bielas para diferentes tipos de motor",
             img: "img/bielas.webp"
            },
            {id:5,
             nombre:"culatas",
             descripcion:"culatas 100% japonesas",
             img: "img/culata.png"
            },
            {id:6,
             nombre:"spark plugs",
             descripcion:"spark plugs con punta de iridium",
             img: "img/spark plug.jfif"
            },
            {id:7,
             nombre:"intercooler",
             descripcion:"sistemas de refrigeración completos",
             img: "img/untercooler.jfif"
            },
            {id:8,
             nombre:"inyectores",
             descripcion:"inyectores programables",
             img: "img/inyectores.jfif"
            },
            {id:9,
             nombre:"turbo",
             descripcion:"turbocargadores de distintas velocidades y presiones",
             img: "img/turbo.jfif"
            },
            {id:10,
             nombre:"pistones",
             descripcion:"pistones hechos 100% en japón de diferentes tamaños",
             img: "img/pistones.webp"
            },
            ]
};

function show_products() {

    const contenedor = document.getElementById("tarjeta-productos");

    if (!contenedor) {
        return;
    }

    contenedor.innerHTML = `
        <div class="row row-cols-1 row-cols-sm-2 row-cols-lg-4 g-4">
        </div>
    `;

    const fila = contenedor.querySelector(".row");

    responseAPI.data.forEach(producto => {

        fila.innerHTML += `

            <div class="col">

                <div class="card h-100 shadow-sm">

                    <img
                        src="${producto.img}"
                        class="card-img-top"
                        alt="${producto.nombre}"
                    >

                    <div class="card-body d-flex flex-column">

                        <h5 class="card-title">
                            ${producto.nombre}
                        </h5>

                        <p class="card-text">
                            ${producto.descripcion}
                        </p>

                        <div class="mt-auto">

                            <button class="btn btn-dark w-100">
                                Ver producto
                            </button>

                        </div>

                    </div>

                </div>

            </div>

        `;
    });
}

show_products();




