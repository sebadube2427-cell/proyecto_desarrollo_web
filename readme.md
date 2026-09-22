Pagina web tipo ecommerce en base a el proyecto de desarrollo web y móbil unab 2026.
corresponde al caso 7 del comercio para un restaurante peruano "Sabor Limeño", pagina responsiva que permite crear pedidos a domicilio previa creacion de cuenta 
mirar un menu, crear solicitudes y más.

la pagina contiene un index el cual sirve como landing page con un hero, seccion para ver el menu, una para contacto para crear solicitudes, un carrusel de productos mas vendidos, para que un producto aparesca en el carrusel, se obtiene su valor de la categoria masvendido de la api, en este caso una const api de js que se utiliza para el front end, si este valor es true entonces aparecera en el carrusel.
la pagina de menu contiene tambien el carrusel y contiene todos los productos que encuentra desde js, se crean las tarjetas con productos segun su categoria directamente con funciones javascript.
pagina contacto es solamente para crear solicitudes genericas como reservas, reclamos etc.
pagina contacto sirve para visualizar los productos que se tienen en carrito con un subtotal, por el momento toda la informacion inputada se guarda en localstorage ya que no esta conectado a ningun backend.
existen paginas de login y registro para usuarios los cuales igualmente guardan la informacion en localstorage por ahora, una vez iniciada sesion el 4to boton del navbar va directamente hacia la pagina perfil donde se puede ver la informacion del usuario y sus pedidos anteriores, la pagina mis pedidos es completamente estatica por el moento pero sirve para visualizar como se veria una vez conectada a un backend.

se crearon varios css, el styles es el general que sirve de guia para todas las paginas, ahi esta la paleta de colores y modifica aspectos generales que aparecen en todas las paginas html como lo son el navbar y footer. el resto son especificos para ciertas paginas, de esta manera se mantiene un orden y mayor legibilidad.

se crearon 3 js, ui.js es el javascript principal y se encarga de crear los innerHTML mas generales, crea las tarjetas de los productos y contiene otras funciones necesarias en algunas pagina para validar de manera temprana algunos datos, contiene tambien la lista con los productos. carrito.js sirve especificamente para conectar funciones del carrito a otras paginas y usuario se encarga de todo lo que se refiere al perfil, crear cuentas y modificarlas junto con sus pedidos.


