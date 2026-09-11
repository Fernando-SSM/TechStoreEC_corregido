/**
 * TechStore EC - Sistema Administrativo y de Ventas de Equipos Tecnológicos
 * Archivo Principal de Lógica y Persistencia de Datos (app.js)
 */

// Base de Datos inicial predeterminada en localStorage
const DB_INITIAL = {
    usuarios: [
        { id: 1, usuario: "admin", contrasena: "Admin@2026!", tipo: "admin", nombre: "Administrador General", correo: "admin@techstore.ec", telefono: "+593 0980790362", fecha: "2026-01-10" },
        { id: 2, usuario: "cliente", contrasena: "Cliente@2026!", tipo: "cliente", nombre: "Carlos Mendoza", correo: "carlos.mendoza@gmail.com", telefono: "0991234567", direccion: "Av. Shyris y El Universo, Quito", fecha: "2026-02-14" },
        { id: 3, usuario: "maria", contrasena: "MariaPass2026!", tipo: "cliente", nombre: "María Fernanda López", correo: "maria.lopez@hotmail.com", telefono: "0984567890", direccion: "Sector La Carolina, Quito", fecha: "2026-03-01" }
    ],

    // Lista de contraseñas comprometidas / débiles que deben rechazarse
    WEAK_PASSWORDS: ["admin123", "cliente123", "1234", "password", "123456", "12345678"],
    categorias: [
        { id: 1, nombre: "Laptops & Portátiles", descripcion: "Equipos portátiles para trabajo, estudio y gaming" },
        { id: 2, nombre: "PC Gamer & Desktop", descripcion: "Computadoras de escritorio de alto rendimiento" },
        { id: 3, nombre: "Monitores & Pantallas", descripcion: "Monitores 4K, Curvos y tasa de refresco alta" },
        { id: 4, nombre: "Periféricos & Accesorios", descripcion: "Teclados mecánicos, mouses gamer, auriculares" },
        { id: 5, nombre: "Componentes & Piezas", descripcion: "Tarjetas de video GPU, Procesadores CPU, memorias RAM" }
    ],
    productos: [
        { id: 101, nombre: "Laptop ASUS ROG Strix G16", categoria: 1, precio: 1550.00, stock: 8, imagen: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=800", descripcion: "Intel i7 13th Gen, 16GB RAM, 512GB SSD RTX 4060", proveedor: "ASUS Ecuador" },
        { id: 102, nombre: "Laptop Lenovo ThinkPad E14", categoria: 1, precio: 780.00, stock: 14, imagen: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800", descripcion: "AMD Ryzen 7, 16GB RAM, 512GB SSD", proveedor: "Lenovo Corp" },
        { id: 103, nombre: "PC Gamer Master RTX 4070 Ti", categoria: 2, precio: 2100.00, stock: 4, imagen: "https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800", descripcion: "Intel i9 14900K, 32GB RAM DDR5, 1TB NVMe, RTX 4070Ti", proveedor: "PC Assemblers" },
        { id: 104, nombre: "Monitor LG UltraGear 27'' 165Hz", categoria: 3, precio: 340.00, stock: 12, imagen: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800", descripcion: "Panel IPS 1ms, QHD 1440p, HDR10 FreeSync", proveedor: "LG Electronics" },
        { id: 105, nombre: "Teclado Mecánico Redragon Kumara", categoria: 4, precio: 55.00, stock: 25, imagen: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800", descripcion: "Switches Red, Iluminación RGB, Anti-ghosting", proveedor: "Redragon Direct" },
        { id: 106, nombre: "Mouse Gamer Logitech G502 Hero", categoria: 4, precio: 68.00, stock: 18, imagen: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800", descripcion: "Sensor HERO 25K, 11 Botones programables", proveedor: "Logitech EC" },
        { id: 107, nombre: "Tarjeta de Video Nvidia RTX 4080 16GB", categoria: 5, precio: 1390.00, stock: 5, imagen: "https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=800", descripcion: "GDDR6X, Ray Tracing Gen 3, DLSS 3", proveedor: "MSI Tech" },
        { id: 108, nombre: "Procesador AMD Ryzen 9 7900X", categoria: 5, precio: 490.00, stock: 9, imagen: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800", descripcion: "12 Núcleos, 24 Hilos, Socket AM5, 5.6GHz Boost", proveedor: "AMD Global" }
    ],
    proveedores: [
        { id: 1, nombre: "ASUS Ecuador S.A.", ruc: "1792345678001", contacto: "Ing. Roberto Paz", telefono: "022987654", correo: "ventas@asus.com.ec", ciudad: "Quito" },
        { id: 2, nombre: "Tech Import Lenovo EC", ruc: "1798765432001", contacto: "Lcda. Andrea Ruiz", telefono: "042345678", correo: "contacto@lenovoimport.ec", ciudad: "Guayaquil" },
        { id: 3, nombre: "Componentes PC Master", ruc: "1791122334001", contacto: "David Salazar", telefono: "022554433", correo: "pedidos@pcmaster.ec", ciudad: "Quito" }
    ],
    ventas: [],
    comprasStock: [],
    carrito: []
};

const API_BASE = 'api/';

async function solicitarAPI(endpoint, accion, datos = {}) {
    let respuesta;
    try {
        respuesta = await fetch(`${API_BASE}${endpoint}.php?action=${encodeURIComponent(accion)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });
    } catch (error) {
        throw new Error('No se pudo conectar con el servidor. Abra la aplicación desde Apache/XAMPP.');
    }

    const textoRespuesta = await respuesta.text();
    let resultado;
    try {
        resultado = textoRespuesta ? JSON.parse(textoRespuesta) : null;
    } catch (error) {
        throw new Error(`El servidor devolvió una respuesta no válida (${respuesta.status}).`);
    }

    if (!resultado) {
        throw new Error(`El servidor devolvió una respuesta vacía (${respuesta.status}).`);
    }
    if (!respuesta.ok || resultado.status !== 'exito') {
        throw new Error(resultado.message || 'No se pudo completar la operación.');
    }
    return resultado.data;
}

function ordenarCategorias(lista = null) {
    const arr = Array.isArray(lista) ? [...lista] : [...(DB.categorias || [])];
    return arr.sort((a, b) => 
        (a.nombre || '').trim().localeCompare((b.nombre || '').trim(), 'es', { sensitivity: 'base', numeric: true })
    );
}

async function cargarDBDesdeAPI() {
    const [categorias, productos, proveedores, comprasStock, ventas, usuarios] = await Promise.all([
        solicitarAPI('categorias', 'listar'),
        solicitarAPI('productos', 'listar'),
        solicitarAPI('proveedores', 'listar'),
        solicitarAPI('compras_stock', 'listar'),
        solicitarAPI('ventas', 'listar'),
        solicitarAPI('auth', 'listar')
    ]);

    DB = obtenerDB();
    DB.usuarios = usuarios || DB.usuarios;
    DB.categorias = ordenarCategorias(categorias || []);
    DB.productos = (productos || []).map(producto => ({
        ...producto,
        id: Number(producto.id),
        categoria: Number(producto.categoria_id ?? producto.categoria),
        precio: Number(producto.precio),
        stock: Number(producto.stock)
    }));
    DB.proveedores = proveedores || [];
    DB.comprasStock = (comprasStock || []).map(compra => ({
        ...compra,
        proveedor: compra.proveedor_nombre,
        total: Number(compra.total)
    }));
    DB.ventas = (ventas || []).map(venta => ({
        ...venta,
        cliente: venta.cliente_nombre,
        clienteId: Number(venta.cliente_id),
        metodoPago: venta.metodo_pago,
        total: Number(venta.total),
        productos: (venta.productos || []).map(item => ({
            ...item,
            id: Number(item.producto_id),
            precio: Number(item.precio_unitario),
            cantidad: Number(item.cantidad)
        }))
    }));
    guardarDB(DB);
    return DB;
}

// Cargar o inicializar almacenamiento local
function obtenerDB() {
    const data = localStorage.getItem('DB_TECHSTORE');
    if (!data) {
        localStorage.setItem('DB_TECHSTORE', JSON.stringify(DB_INITIAL));
        return DB_INITIAL;
    }
    return JSON.parse(data);
}

function guardarDB(db) {
    localStorage.setItem('DB_TECHSTORE', JSON.stringify(db));
}

let DB = obtenerDB();
let modoAutenticacion = 'cliente';

// --- NOTIFICACIONES TOAST ---
function mostrarNotificacion(mensaje, tipo = 'exito') {
    let contenedor = document.getElementById('toastContainer');
    if (!contenedor) {
        contenedor = document.createElement('div');
        contenedor.id = 'toastContainer';
        contenedor.className = 'toast-container';
        document.body.appendChild(contenedor);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${tipo}`;
    const icono = tipo === 'exito' ? 'fa-circle-check' : tipo === 'error' ? 'fa-circle-xmark' : 'fa-triangle-exclamation';
    toast.innerHTML = `<i class="fa-solid ${icono}"></i> <span>${mensaje}</span>`;

    contenedor.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('mostrar');
    }, 50);

    setTimeout(() => {
        toast.classList.remove('mostrar');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// --- AUTENTICACIÓN Y SESIÓN ---
function obtenerSesion() {
    return JSON.parse(localStorage.getItem('sesion_techstore')) || null;
}

function verificarGuardiaRutal() {
    const sesion = obtenerSesion();
    const path = window.location.pathname;

    if (path.includes('admin.html') || path.includes('proveedores.html') || path.includes('reportes.html') || path.includes('nueva-categoria.html') || path.includes('nuevo-proveedor.html') || path.includes('nuevo-ingreso-stock.html')) {
        if (!sesion || sesion.tipo !== 'admin') {
            mostrarNotificacion('Acceso restringido. Inicie sesión como Administrador.', 'error');
            setTimeout(() => window.location.href = 'index.html', 1200);
        }
    } else if (path.includes('cliente.html')) {
        if (!sesion || sesion.tipo !== 'cliente') {
            mostrarNotificacion('Acceso solo para Clientes. Inicie sesión.', 'error');
            setTimeout(() => window.location.href = 'index.html', 1200);
        }
    }
}

// Escuchar envío de formulario de Login
document.getElementById('formLogin')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const user = document.getElementById('usuario').value.trim();
    const pass = document.getElementById('contrasena').value.trim();

    try {
        const usuarioEncontrado = await solicitarAPI('auth', 'login', { usuario: user, contrasena: pass });
        if (usuarioEncontrado.tipo !== modoAutenticacion) {
            const tipoEsperado = modoAutenticacion === 'admin' ? 'administrador' : 'cliente';
            throw new Error(`Este acceso es exclusivo para ${tipoEsperado}s.`);
        }
        localStorage.setItem('sesion_techstore', JSON.stringify(usuarioEncontrado));
        setTimeout(() => { window.location.href = usuarioEncontrado.tipo === 'admin' ? 'admin.html' : 'cliente.html'; }, 800);
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
});

// Escuchar registro de nuevos clientes
document.getElementById('formRegistro')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nombre = document.getElementById('regNombre').value.trim();
    const usuario = document.getElementById('regUsuario').value.trim();
    const correo = document.getElementById('regCorreo').value.trim();
    const telefonoRaw = document.getElementById('regTelefono').value.trim();
    const telefono = telefonoRaw.replace(/\D/g, '');
    const contrasena = document.getElementById('regContrasena').value.trim();

    // Validar teléfono: exactamente 10 dígitos
    const regTelefonoErrorEl = document.getElementById('regTelefonoError');
    if (telefono.length !== 10) {
        if (regTelefonoErrorEl) { regTelefonoErrorEl.style.display = 'block'; }
        mostrarNotificacion('El teléfono debe contener exactamente 10 dígitos.', 'error');
        return;
    } else {
        if (regTelefonoErrorEl) { regTelefonoErrorEl.style.display = 'none'; }
    }

    const weakList = DB_INITIAL.WEAK_PASSWORDS || [];
    if (weakList.includes(contrasena)) {
        mostrarNotificacion('La contraseña ingresada es débil o ha sido comprometida, por favor elija otra contraseña más segura.', 'error');
        return;
    }

    try {
        await solicitarAPI('auth', 'registro', { nombre, usuario, correo, telefono, contrasena });
        try {
            await cargarDBDesdeAPI();
        } catch (error) {
        }
        mostrarNotificacion('¡Registro exitoso! Ya puedes iniciar sesión con tu cuenta.', 'exito');
        cambiarTabAuth('login');
        document.getElementById('usuario').value = usuario;
        document.getElementById('contrasena').value = contrasena;
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
});

// Funciones de control de Modales
function mostrarLogin(modo = 'cliente') {
    modoAutenticacion = modo;
    const modal = document.getElementById('modalLogin');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    configurarAccesoAuth();
}

function mostrarRegistro() {
    mostrarLogin('cliente');
    cambiarTabAuth('registro');
}

function configurarAccesoAuth() {
    const esAdmin = modoAutenticacion === 'admin';
    const tabRegistro = document.getElementById('tabRegBtn');
    const textoTabLogin = document.getElementById('textoTabLogin');
    const tituloFormLogin = document.getElementById('tituloFormLogin');
    const textoFormLogin = document.getElementById('textoFormLogin');
    if (tabRegistro) tabRegistro.style.display = esAdmin ? 'none' : '';
    if (textoTabLogin) textoTabLogin.textContent = esAdmin ? 'Acceso administrador' : 'Acceso cliente';
    if (tituloFormLogin) tituloFormLogin.textContent = esAdmin ? 'Acceso de administrador' : 'Acceso para clientes';
    if (textoFormLogin) textoFormLogin.textContent = esAdmin ? 'Ingresa con las credenciales autorizadas del panel.' : 'Inicia sesión para comprar y consultar tus pedidos.';
    if (esAdmin) cambiarTabAuth('login');
}

function cerrarLogin() {
    const modal = document.getElementById('modalLogin');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function cambiarTabAuth(tab) {
    const tabLogin = document.getElementById('tabLoginBtn');
    const tabReg = document.getElementById('tabRegBtn');
    const formLogin = document.getElementById('formLogin');
    const formRegistro = document.getElementById('formRegistro');

    if (tab === 'login') {
        tabLogin?.classList.add('activo');
        tabReg?.classList.remove('activo');
        if (formLogin) formLogin.style.display = 'block';
        if (formRegistro) formRegistro.style.display = 'none';
    } else {
        tabReg?.classList.add('activo');
        tabLogin?.classList.remove('activo');
        if (formLogin) formLogin.style.display = 'none';
        if (formRegistro) formRegistro.style.display = 'block';
    }
}

function cerrarSesion() {
    if (confirm('¿Desea cerrar la sesión actual?')) {
        localStorage.removeItem('sesion_techstore');
        setTimeout(() => window.location.href = 'index.html', 600);
    }
}


// ==========================================
// LÓGICA DEL PANEL ADMINISTRADOR (admin.html)
// ==========================================

const UMBRAL_STOCK_BAJO = 3;
let filtroStockBajoActivo = false;

function alternarFiltroStockBajo() {
    filtroStockBajoActivo = !filtroStockBajoActivo;
    const inputBuscar = document.getElementById('inputBuscarAdmin');
    const valorBusqueda = inputBuscar ? inputBuscar.value : '';
    renderTablaProductosAdmin(valorBusqueda);

    if (filtroStockBajoActivo) {
        const cant = DB.productos.filter(p => Number(p.stock) <= UMBRAL_STOCK_BAJO).length;
        mostrarNotificacion(`Filtro activado: mostrando ${cant} producto(s) con stock bajo (≤ 3 unidades).`, 'advertencia');
    }
}

function quitarFiltroStockBajo() {
    filtroStockBajoActivo = false;
    const inputBuscar = document.getElementById('inputBuscarAdmin');
    renderTablaProductosAdmin(inputBuscar ? inputBuscar.value : '');
}

function irAInventarioStockBajo() {
    const itemMenu = document.querySelector(`.menu-sidebar li[onclick*="'productos'"]`);
    mostrarSeccionAdmin('productos', itemMenu);
    filtroStockBajoActivo = true;
    renderTablaProductosAdmin();
    const cant = DB.productos.filter(p => Number(p.stock) <= UMBRAL_STOCK_BAJO).length;
    mostrarNotificacion(`Mostrando ${cant} producto(s) con stock bajo (≤ 3 unidades).`, 'advertencia');
}

function inicializarAdmin() {
    verificarGuardiaRutal();
    DB = obtenerDB();

    const sesion = obtenerSesion();
    if (sesion && document.getElementById('nombreAdminSidebar')) {
        document.getElementById('nombreAdminSidebar').innerText = sesion.nombre;
    }

    cargarDashboardStats();
    renderTablaProductosAdmin();
    renderCategoriasAdmin();
    renderVentasAdmin();
    renderClientesAdmin();

    const activarSeccionDesdeUrl = () => {
        const hashSeccion = window.location.hash.replace('#', '');
        const paramSeccion = new URLSearchParams(window.location.search).get('seccion');
        const seccionActiva = hashSeccion || paramSeccion;
        if (seccionActiva) {
            const itemMenu = document.querySelector(`.menu-sidebar li[onclick*="'${seccionActiva}'"]`);
            mostrarSeccionAdmin(seccionActiva, itemMenu);
        }
    };

    activarSeccionDesdeUrl();
    window.addEventListener('hashchange', activarSeccionDesdeUrl);

    // Alerta automática si hay equipos con stock crítico (≤ 3 unidades)
    const prodsCriticos = DB.productos.filter(p => Number(p.stock) <= UMBRAL_STOCK_BAJO);
    if (prodsCriticos.length > 0) {
        setTimeout(() => {
            mostrarNotificacion(`¡Alerta de Inventario! ${prodsCriticos.length} producto(s) tienen stock bajo (3 o menos unidades).`, 'advertencia');
        }, 900);
    }
}

function mostrarSeccionAdmin(idSeccion, elementoClick = null) {
    document.querySelectorAll('.seccion-admin').forEach(sec => sec.classList.add('oculto'));
    const seccionTarget = document.getElementById(idSeccion);
    if (seccionTarget) seccionTarget.classList.remove('oculto');

    if (elementoClick) {
        document.querySelectorAll('.menu-sidebar li').forEach(li => li.classList.remove('activo'));
        elementoClick.classList.add('activo');
    }

    const tituloEl = document.getElementById('tituloSeccionTop');
    if (tituloEl && elementoClick) {
        tituloEl.innerText = elementoClick.innerText.trim();
    }

    // Refrescar datos según la sección
    DB = obtenerDB();
    if (idSeccion === 'dashboard') cargarDashboardStats();
    if (idSeccion === 'productos') renderTablaProductosAdmin();
    if (idSeccion === 'categorias') renderCategoriasAdmin();
    if (idSeccion === 'ventas') renderVentasAdmin();
    if (idSeccion === 'clientes') renderClientesAdmin();
}

function cargarDashboardStats() {
    DB = obtenerDB();

    const totalProdEl = document.getElementById('dashTotalProd');
    const totalVentasEl = document.getElementById('dashTotalVentas');
    const totalCliEl = document.getElementById('dashTotalCli');
    const stockBajoEl = document.getElementById('dashStockBajo');

    const totalVentasMonto = DB.ventas.reduce((acc, v) => acc + v.total, 0);
    const prodBajoStock = DB.productos.filter(p => Number(p.stock) <= UMBRAL_STOCK_BAJO).length;

    if (totalProdEl) totalProdEl.innerText = DB.productos.length;
    if (totalVentasEl) totalVentasEl.innerText = '$' + totalVentasMonto.toFixed(2);
    if (totalCliEl) totalCliEl.innerText = DB.usuarios.filter(u => u.tipo === 'cliente').length;
    if (stockBajoEl) stockBajoEl.innerText = prodBajoStock;

    // Renderizar últimas 5 ventas en el dashboard
    const tbodyUltimas = document.querySelector('#tablaUltimasVentas tbody');
    if (tbodyUltimas) {
        let html = '';
        const ultimas = [...DB.ventas].reverse().slice(0, 5);
        if (ultimas.length === 0) {
            html = `<tr><td colspan="5" class="text-center">No hay ventas registradas aún.</td></tr>`;
        } else {
            ultimas.forEach(v => {
                const badgeClass = v.estado === 'Entregado' ? 'badge-exito' : v.estado === 'Enviado' ? 'badge-info' : 'badge-advertencia';
                html += `
                    <tr>
                        <td>#${v.id}</td>
                        <td>${v.cliente}</td>
                        <td>${v.fecha}</td>
                        <td><strong>$${v.total.toFixed(2)}</strong></td>
                        <td><span class="badge ${badgeClass}">${v.estado}</span></td>
                    </tr>
                `;
            });
        }
        tbodyUltimas.innerHTML = html;
    }

    const tbodyClientes = document.querySelector('#tablaUltimosClientes tbody');
    if (tbodyClientes) {
        const clientes = DB.usuarios
            .filter(usuario => usuario.tipo === 'cliente')
            .sort((a, b) => Number(b.id) - Number(a.id))
            .slice(0, 5);

        if (clientes.length === 0) {
            tbodyClientes.innerHTML = '<tr><td colspan="5" class="text-center">No hay clientes registrados aún.</td></tr>';
        } else {
            tbodyClientes.innerHTML = clientes.map(cliente => {
                const pedidos = DB.ventas.filter(venta => Number(venta.clienteId) === Number(cliente.id)).length;
                return `
                    <tr>
                        <td>#${cliente.id}</td>
                        <td><strong>${cliente.nombre}</strong><br><small class="text-muted">@${cliente.usuario}</small></td>
                        <td>${cliente.correo}</td>
                        <td>${cliente.fecha || 'Sin fecha'}</td>
                        <td><span class="badge badge-info">${pedidos} Pedido${pedidos === 1 ? '' : 's'}</span></td>
                    </tr>
                `;
            }).join('');
        }
    }
}

function renderTablaProductosAdmin(filtroTexto = '') {
    DB = obtenerDB();
    const tbody = document.querySelector('#tablaProductosAdmin tbody');
    if (!tbody) return;

    const productosCriticos = DB.productos.filter(p => Number(p.stock) <= UMBRAL_STOCK_BAJO);
    const cantCriticos = productosCriticos.length;

    // Actualizar botón de alerta de stock bajo
    const btnAlerta = document.getElementById('btnAlertaStockBajo');
    const textoBtnAlerta = document.getElementById('textoBtnAlertaStock');
    if (btnAlerta && textoBtnAlerta) {
        if (cantCriticos > 0) {
            btnAlerta.style.display = 'inline-flex';
            btnAlerta.className = `btn-alerta-stock-toggle ${filtroStockBajoActivo ? 'btn-secundario' : 'alerta-activa'}`;
            textoBtnAlerta.innerHTML = filtroStockBajoActivo
                ? `<i class="fa-solid fa-list"></i> Ver Todo (${DB.productos.length})`
                : `Stock Bajo: <strong>${cantCriticos}</strong> (≤ 3)`;
        } else {
            btnAlerta.style.display = 'inline-flex';
            btnAlerta.className = 'btn-alerta-stock-toggle alerta-optimo';
            textoBtnAlerta.innerHTML = `<i class="fa-solid fa-circle-check"></i> Stock Óptimo (0)`;
        }
    }

    // Actualizar banner de alerta de stock crítico
    const banner = document.getElementById('bannerAlertaStockAdmin');
    const textoBanner = document.getElementById('bannerAlertaDesc');
    const textoBtnBanner = document.getElementById('textoBtnBannerFiltro');
    if (banner) {
        if (cantCriticos > 0) {
            banner.style.display = 'flex';
            if (textoBanner) {
                const nombresProds = productosCriticos.slice(0, 3).map(p => `<strong>${p.nombre}</strong> (${p.stock} unids)`).join(', ');
                const mas = cantCriticos > 3 ? ` y ${cantCriticos - 3} más` : '';
                textoBanner.innerHTML = `Tienes <strong>${cantCriticos} equipo(s)</strong> con 3 o menos unidades disponibles: ${nombresProds}${mas}.`;
            }
            if (textoBtnBanner) {
                textoBtnBanner.textContent = filtroStockBajoActivo ? 'Ver todos los equipos' : 'Ver equipos críticos';
            }
        } else {
            banner.style.display = 'none';
        }
    }

    // Actualizar badge de filtro activo
    const filtroBadge = document.getElementById('filtroActivoBadge');
    if (filtroBadge) {
        filtroBadge.style.display = filtroStockBajoActivo ? 'block' : 'none';
    }

    // Filtrar productos
    let productosFiltrados = DB.productos.filter(p => p.nombre.toLowerCase().includes(filtroTexto.toLowerCase()));
    if (filtroStockBajoActivo) {
        productosFiltrados = productosFiltrados.filter(p => Number(p.stock) <= UMBRAL_STOCK_BAJO);
    }

    let html = '';
    if (productosFiltrados.length === 0) {
        html = filtroStockBajoActivo
            ? `<tr><td colspan="7" class="text-center" style="padding:30px;"><i class="fa-solid fa-circle-check" style="font-size:28px; color:var(--success); margin-bottom:8px; display:block;"></i>¡Excelente! No hay equipos con stock bajo (≤ 3 unidades). <button type="button" class="btn-secundario btn-sm" onclick="quitarFiltroStockBajo()" style="margin-left:10px;">Ver todos los equipos</button></td></tr>`
            : `<tr><td colspan="7" class="text-center">No se encontraron productos registrados.</td></tr>`;
    } else {
        productosFiltrados.forEach(p => {
            const catObj = DB.categorias.find(c => c.id === p.categoria);
            const catNombre = catObj ? catObj.nombre : 'Sin Categoría';
            const stockNum = Number(p.stock);

            let stockHtml = '';
            if (stockNum <= 0) {
                stockHtml = `<span class="badge badge-peligro"><i class="fa-solid fa-ban"></i> 0 unids (Agotado)</span>`;
            } else if (stockNum <= UMBRAL_STOCK_BAJO) {
                stockHtml = `<span class="badge badge-stock-alerta badge-alerta-parpadeo"><i class="fa-solid fa-triangle-exclamation"></i> ${stockNum} unids (Stock Bajo)</span>`;
            } else if (stockNum <= 8) {
                stockHtml = `<span class="badge badge-advertencia">${stockNum} unids</span>`;
            } else {
                stockHtml = `<span class="badge badge-exito">${stockNum} unids</span>`;
            }

            html += `
                <tr ${stockNum <= UMBRAL_STOCK_BAJO ? 'style="background: #fff8f8;"' : ''}>
                    <td>
                        <img src="${p.imagen}" alt="${p.nombre}" class="img-thumb">
                    </td>
                    <td><strong>${p.nombre}</strong><br><small class="text-muted">${p.descripcion || ''}</small></td>
                    <td><span class="badge badge-categoria">${catNombre}</span></td>
                    <td>$${Number(p.precio).toFixed(2)}</td>
                    <td>${stockHtml}</td>
                    <td><small>${p.proveedor || 'N/A'}</small></td>
                    <td>
                        <div class="acciones-btn">
                            <button class="btn-icon btn-editar" onclick="prepararEditarProducto(${p.id})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="btn-icon btn-eliminar" onclick="eliminarProductoAdmin(${p.id})" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    tbody.innerHTML = html;
}

function abrirModalProducto(esEditar = false) {
    const modal = document.getElementById('modalProductoAdmin');
    const titulo = document.getElementById('tituloModalProdAdmin');
    const form = document.getElementById('formProductoAdmin');
    const selectCat = document.getElementById('catProdAdmin');

    if (!modal) return;

    // Cargar select de categorías en orden alfabético
    DB = obtenerDB();
    DB.categorias = ordenarCategorias(DB.categorias);
    let optionsCat = '<option value="">-- Seleccionar Categoría --</option>';
    DB.categorias.forEach(c => {
        optionsCat += `<option value="${c.id}">${c.nombre}</option>`;
    });
    selectCat.innerHTML = optionsCat;

    if (!esEditar) {
        titulo.innerText = 'Agregar Nuevo Equipo Tecnológico';
        form.reset();
        document.getElementById('idProdAdmin').value = '';
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarModalProductoAdmin() {
    const modal = document.getElementById('modalProductoAdmin');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function prepararEditarProducto(id) {
    DB = obtenerDB();
    const prod = DB.productos.find(p => p.id === id);
    if (!prod) return;

    abrirModalProducto(true);
    document.getElementById('tituloModalProdAdmin').innerText = `Editar: ${prod.nombre}`;
    document.getElementById('idProdAdmin').value = prod.id;
    document.getElementById('nombreProdAdmin').value = prod.nombre;
    document.getElementById('catProdAdmin').value = prod.categoria;
    document.getElementById('precioProdAdmin').value = prod.precio;
    document.getElementById('stockProdAdmin').value = prod.stock;
    document.getElementById('imagenProdAdmin').value = prod.imagen;
    document.getElementById('descProdAdmin').value = prod.descripcion || '';
    document.getElementById('provProdAdmin').value = prod.proveedor || '';
}

document.getElementById('formProductoAdmin')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    DB = obtenerDB();

    const id = document.getElementById('idProdAdmin').value;
    const nombre = document.getElementById('nombreProdAdmin').value.trim();
    const categoria = parseInt(document.getElementById('catProdAdmin').value);
    const precio = parseFloat(document.getElementById('precioProdAdmin').value);
    const stock = parseInt(document.getElementById('stockProdAdmin').value);
    const imagen = document.getElementById('imagenProdAdmin').value.trim() || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=800";
    const descripcion = document.getElementById('descProdAdmin').value.trim();
    const proveedor = document.getElementById('provProdAdmin').value.trim();

    try {
        await solicitarAPI('productos', id ? 'editar' : 'crear', {
            id: id ? parseInt(id) : undefined,
            nombre, categoria_id: categoria, precio, stock, imagen, descripcion, proveedor
        });
        await cargarDBDesdeAPI();
        cerrarModalProductoAdmin();
        mostrarNotificacion(id ? 'Producto actualizado con éxito.' : 'Nuevo equipo guardado correctamente.', 'exito');
        renderTablaProductosAdmin();
        cargarDashboardStats();
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
});

async function eliminarProductoAdmin(id) {
    if (confirm('¿Está seguro de eliminar este producto del inventario?')) {
        try {
            await solicitarAPI('productos', 'eliminar', { id });
            await cargarDBDesdeAPI();
            mostrarNotificacion('Producto eliminado.', 'exito');
            renderTablaProductosAdmin();
            cargarDashboardStats();
        } catch (error) {
            mostrarNotificacion(error.message, 'error');
        }
    }
}

// Categorías Admin
function renderCategoriasAdmin() {
    DB = obtenerDB();
    DB.categorias = ordenarCategorias(DB.categorias);
    const contenedor = document.getElementById('gridCategoriasAdmin');
    if (!contenedor) return;

    let html = '';
    DB.categorias.forEach(cat => {
        const cantProductos = DB.productos.filter(p => p.categoria === cat.id).length;
        html += `
            <div class="card-categoria-admin">
                <div class="header-cat">
                    <h3><i class="fa-solid fa-tag"></i> ${cat.nombre}</h3>
                    <div class="acciones-btn">
                        <button class="btn-icon btn-editar" onclick="prepararEditarCategoriaAdmin(${cat.id})" title="Actualizar"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn-icon btn-eliminar" onclick="eliminarCategoriaAdmin(${cat.id})" title="Eliminar"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <p>${cat.descripcion || 'Categoría de equipos tecnológicos'}</p>
                <div class="footer-cat">
                    <span class="badge badge-info">${cantProductos} Productos vinculados</span>
                </div>
            </div>
        `;
    });

    contenedor.innerHTML = html;
}

function prepararEditarCategoriaAdmin(id) {
    DB = obtenerDB();
    const categoria = DB.categorias.find(cat => cat.id === id);
    const modal = document.getElementById('modalCategoriaAdmin');
    if (!categoria || !modal) return;

    document.getElementById('idCategoriaAdmin').value = categoria.id;
    document.getElementById('nombreEditarCategoriaAdmin').value = categoria.nombre || '';
    document.getElementById('descEditarCategoriaAdmin').value = categoria.descripcion || '';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarModalCategoriaAdmin() {
    const modal = document.getElementById('modalCategoriaAdmin');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

document.getElementById('formEditarCategoriaAdmin')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('idCategoriaAdmin').value);
    const nombre = document.getElementById('nombreEditarCategoriaAdmin').value.trim();
    const descripcion = document.getElementById('descEditarCategoriaAdmin').value.trim();

    try {
        await solicitarAPI('categorias', 'editar', { id, nombre, descripcion });
        await cargarDBDesdeAPI();
        DB.categorias = ordenarCategorias(DB.categorias);
        cerrarModalCategoriaAdmin();
        mostrarNotificacion('Categoría actualizada correctamente.', 'exito');
        renderCategoriasAdmin();
        renderCategoriasLanding();
        setTimeout(() => { window.location.href = 'admin.html#categorias'; }, 700);
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
});

document.getElementById('formCategoriaAdmin')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nombre = document.getElementById('nombreCatAdmin').value.trim();
    const desc = document.getElementById('descCatAdmin').value.trim();

    if (!nombre) return;

    try {
        await solicitarAPI('categorias', 'crear', { nombre, descripcion: desc });
        await cargarDBDesdeAPI();
        DB.categorias = ordenarCategorias(DB.categorias);
        mostrarNotificacion('Nueva categoría creada con éxito.', 'exito');
        this.reset();
        renderCategoriasAdmin();
        cargarFiltrosCliente();
        renderCategoriasLanding();
        setTimeout(() => {
            window.location.href = 'admin.html#categorias';
        }, 700);
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
});

async function eliminarCategoriaAdmin(id) {
    if (confirm('¿Eliminar esta categoría?')) {
        try {
            await solicitarAPI('categorias', 'eliminar', { id });
            await cargarDBDesdeAPI();
            DB.categorias = ordenarCategorias(DB.categorias);
            mostrarNotificacion('Categoría eliminada.', 'exito');
            renderCategoriasAdmin();
            cargarFiltrosCliente();
            renderCategoriasLanding();
        } catch (error) {
            mostrarNotificacion(error.message, 'error');
        }
    }
}

// Ventas Admin
function renderVentasAdmin() {
    DB = obtenerDB();
    const tbody = document.querySelector('#tablaVentasAdmin tbody');
    if (!tbody) return;

    let html = '';
    if (DB.ventas.length === 0) {
        html = `<tr><td colspan="7" class="text-center">No hay registros de ventas.</td></tr>`;
    } else {
        DB.ventas.forEach(v => {
            const badgeClass = v.estado === 'Entregado' ? 'badge-exito' : v.estado === 'Enviado' ? 'badge-info' : 'badge-advertencia';
            html += `
                <tr>
                    <td><strong>#${v.id}</strong></td>
                    <td>${v.cliente}</td>
                    <td>${v.fecha}</td>
                    <td>${v.metodoPago || 'Efectivo'}</td>
                    <td><strong>$${v.total.toFixed(2)}</strong></td>
                    <td>
                        <select onchange="cambiarEstadoVentaAdmin(${v.id}, this.value)" class="select-estado">
                            <option value="Pendiente" ${v.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                            <option value="Enviado" ${v.estado === 'Enviado' ? 'selected' : ''}>Enviado</option>
                            <option value="Entregado" ${v.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
                        </select>
                    </td>
                    <td>
                        <div class="acciones-btn">
                            <button class="btn-icon btn-editar" onclick="actualizarVentaAdmin(${v.id})" title="Actualizar estado"><i class="fa-solid fa-rotate"></i></button>
                            <button class="btn-secundario btn-sm" onclick="verDetalleVentaAdmin(${v.id})"><i class="fa-solid fa-eye"></i> Detalle</button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    tbody.innerHTML = html;
}

async function actualizarVentaAdmin(idVenta) {
    const filas = document.querySelectorAll('#tablaVentasAdmin tbody tr');
    const fila = [...filas].find(elemento => elemento.querySelector(`button[onclick="actualizarVentaAdmin(${idVenta})"]`));
    const selector = fila?.querySelector('.select-estado');
    if (selector) await cambiarEstadoVentaAdmin(idVenta, selector.value);
}

async function cambiarEstadoVentaAdmin(idVenta, nuevoEstado) {
    try {
        await solicitarAPI('ventas', 'actualizar', { id: idVenta, estado: nuevoEstado });
        await cargarDBDesdeAPI();
        mostrarNotificacion(`Estado de la venta #${idVenta} actualizado a: ${nuevoEstado}`, 'exito');
        renderVentasAdmin();
        cargarDashboardStats();
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
}

function verDetalleVentaAdmin(idVenta) {
    DB = obtenerDB();
    const venta = DB.ventas.find(v => v.id === idVenta);
    if (!venta) return;

    let itemsHtml = '';
    venta.productos.forEach(p => {
        itemsHtml += `
            <div class="item-recibo">
                <span>${p.nombre} x${p.cantidad || 1}</span>
                <span>$${((p.precio) * (p.cantidad || 1)).toFixed(2)}</span>
            </div>
        `;
    });

    let datosPagoHtml = '';
    if (venta.datosPago && typeof venta.datosPago === 'object') {
        datosPagoHtml += `<div style="background:#f8fafc; padding:12px; border-radius:var(--radius-md); margin-top:10px; font-size:13px; border:1px solid var(--border-color);">
            <strong>Detalles del Pago (${venta.metodoPago}):</strong><br>`;
        if (venta.datosPago.numero_mascarado) datosPagoHtml += `<small>• Tarjeta: ${venta.datosPago.numero_mascarado} (${venta.datosPago.cuotas || '1 cuota'})</small><br>`;
        if (venta.datosPago.titular) datosPagoHtml += `<small>• Titular: ${venta.datosPago.titular}</small><br>`;
        if (venta.datosPago.banco_origen) datosPagoHtml += `<small>• Banco: ${venta.datosPago.banco_origen} - N° Comprobante: ${venta.datosPago.numero_comprobante || 'N/A'}</small><br>`;
        if (venta.datosPago.monto_abonado) datosPagoHtml += `<small>• Abonado: ${venta.datosPago.monto_abonado} (Vuelto estimado: ${venta.datosPago.vuelto_estimado || '$0.00'})</small><br>`;
        if (venta.datosPago.direccion_entrega) datosPagoHtml += `<small>• Dirección de Entrega: ${venta.datosPago.direccion_entrega}</small><br>`;
        datosPagoHtml += `</div>`;
    }

    const modal = document.getElementById('modalDetalleVenta');
    const contenido = document.getElementById('contenidoDetalleVenta');

    if (modal && contenido) {
        contenido.innerHTML = `
            <h3>Comprobante de Venta #${venta.id}</h3>
            <p><strong>Cliente:</strong> ${venta.cliente}</p>
            <p><strong>Fecha:</strong> ${venta.fecha}</p>
            <p><strong>Método de Pago:</strong> ${venta.metodoPago}</p>
            <p><strong>Estado:</strong> ${venta.estado}</p>
            ${datosPagoHtml}
            <hr>
            <h4>Productos:</h4>
            ${itemsHtml}
            <hr>
            <div class="total-recibo">
                <strong>Total Pagado:</strong>
                <strong>$${venta.total.toFixed(2)}</strong>
            </div>
        `;
        modal.style.display = 'flex';
    }
}

function cerrarModalDetalleVenta() {
    const modal = document.getElementById('modalDetalleVenta');
    if (modal) modal.style.display = 'none';
}

// Clientes Admin
function renderClientesAdmin() {
    DB = obtenerDB();
    const tbody = document.querySelector('#tablaClientesAdmin tbody');
    if (!tbody) return;

    let html = '';
    const clientes = DB.usuarios.filter(u => u.tipo === 'cliente');

    if (clientes.length === 0) {
        html = `<tr><td colspan="7" class="text-center">No hay clientes registrados.</td></tr>`;
    } else {
        clientes.forEach(c => {
            const comprasCliente = DB.ventas.filter(v => v.clienteId === c.id || v.cliente === c.nombre);
            const totalGastado = comprasCliente.reduce((acc, v) => acc + v.total, 0);

            html += `
                <tr>
                    <td>#${c.id}</td>
                    <td><strong>${c.nombre}</strong><br><small class="text-muted">@${c.usuario}</small></td>
                    <td>${c.correo}</td>
                    <td>${c.telefono || 'Sin teléfono'}</td>
                    <td><span class="badge badge-info">${comprasCliente.length} Pedidos</span></td>
                    <td><strong>$${totalGastado.toFixed(2)}</strong></td>
                    <td>
                        <div class="acciones-btn">
                            <button class="btn-icon btn-editar" onclick="prepararEditarCliente(${c.id})" title="Editar"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="btn-icon btn-eliminar" onclick="eliminarClienteAdmin(${c.id})" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>
            `;
        });
    }
    tbody.innerHTML = html;
}

function prepararEditarCliente(id) {
    DB = obtenerDB();
    const cliente = DB.usuarios.find(u => u.id === id && u.tipo === 'cliente');
    if (!cliente) return;

    const modal = document.getElementById('modalClienteAdmin');
    if (!modal) return;

    document.getElementById('idClienteAdmin').value = cliente.id;
    document.getElementById('nombreClienteAdmin').value = cliente.nombre || '';
    document.getElementById('usuarioClienteAdmin').value = cliente.usuario || '';
    document.getElementById('correoClienteAdmin').value = cliente.correo || '';
    document.getElementById('telefonoClienteAdmin').value = cliente.telefono || '';
    document.getElementById('direccionClienteAdmin').value = cliente.direccion || '';
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarModalClienteAdmin() {
    const modal = document.getElementById('modalClienteAdmin');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

document.getElementById('formClienteAdmin')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    const id = parseInt(document.getElementById('idClienteAdmin').value);
    const nombre = document.getElementById('nombreClienteAdmin').value.trim();
    const usuario = document.getElementById('usuarioClienteAdmin').value.trim();
    const correo = document.getElementById('correoClienteAdmin').value.trim();
    const telefono = document.getElementById('telefonoClienteAdmin').value.trim();
    const direccion = document.getElementById('direccionClienteAdmin').value.trim();

    if (!id || !nombre || !usuario || !correo) {
        mostrarNotificacion('Completa los datos obligatorios del cliente.', 'error');
        return;
    }

    try {
        await solicitarAPI('auth', 'editar', {
            id,
            nombre,
            usuario,
            correo,
            telefono,
            direccion
        });
        await cargarDBDesdeAPI();
        cerrarModalClienteAdmin();
        mostrarNotificacion('Cliente actualizado correctamente.', 'exito');
        renderClientesAdmin();
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
});

async function eliminarClienteAdmin(id) {
    if (!confirm('¿Deseas eliminar este cliente del sistema?')) return;

    try {
        await solicitarAPI('auth', 'eliminar', { id });
        await cargarDBDesdeAPI();
        mostrarNotificacion('Cliente eliminado.', 'exito');
        renderClientesAdmin();
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
}


// ==========================================
// LÓGICA DEL PORTAL DEL CLIENTE (cliente.html)
// ==========================================

function inicializarCliente() {
    verificarGuardiaRutal();
    DB = obtenerDB();

    const sesion = obtenerSesion();
    if (sesion && document.getElementById('nombreClienteNav')) {
        document.getElementById('nombreClienteNav').innerText = sesion.nombre;
    }

    cargarFiltrosCliente();
    renderCatalogoCliente();
    actualizarBadgesCarrito();
}

function cargarFiltrosCliente() {
    DB = obtenerDB();
    DB.categorias = ordenarCategorias(DB.categorias);
    const selectCat = document.getElementById('filtroCatCliente');
    if (!selectCat) return;

    let options = '<option value="">Todas las Categorías</option>';
    DB.categorias.forEach(c => {
        options += `<option value="${c.id}">${c.nombre}</option>`;
    });
    selectCat.innerHTML = options;
}

let categoriaLandingActual = '';

function renderCategoriasLanding() {
    DB = obtenerDB();
    DB.categorias = ordenarCategorias(DB.categorias);
    const categorias = DB.categorias;
    const sidebar = document.getElementById('categoriasLandingDinamicas');
    const nav = document.getElementById('navCategoriasLanding');

    if (sidebar) {
        sidebar.innerHTML = categorias.map(categoria => `
            <button class="filtro-categoria" data-categoria="${categoria.id}"
                onclick="seleccionarCategoriaLanding(${Number(categoria.id)})">
                ${categoria.nombre} <span><i class="fa-solid fa-chevron-right"></i></span>
            </button>
        `).join('');
    }

    if (nav) {
        nav.innerHTML = categorias.map(categoria => `
            <a href="#catalogoHome" onclick="seleccionarCategoriaLanding(${Number(categoria.id)})">
                ${categoria.nombre}
            </a>
        `).join('');
    }

    document.querySelectorAll('.filtro-categoria').forEach(boton => {
        boton.classList.toggle('activo', String(boton.dataset.categoria) === String(categoriaLandingActual));
    });
}

function renderCatalogoLanding() {
    filtrarCatalogoLanding();
}

function seleccionarCategoriaLanding(categoria) {
    categoriaLandingActual = categoria ? Number(categoria) : '';
    renderCategoriasLanding();
    document.querySelectorAll('.filtro-categoria').forEach(boton => {
        boton.classList.toggle('activo', String(boton.dataset.categoria) === String(categoriaLandingActual));
    });
    filtrarCatalogoLanding();
}

function filtrarCatalogoLanding() {
    DB = obtenerDB();
    const grid = document.getElementById('gridProductosLanding');
    if (!grid) return;

    const busqueda = document.getElementById('buscarLanding')?.value.toLowerCase().trim() || '';
    const orden = document.getElementById('ordenLanding')?.value || 'destacados';
    let productos = [...DB.productos];

    if (categoriaLandingActual) {
        productos = productos.filter(p => Number(p.categoria) === Number(categoriaLandingActual));
    }
    if (busqueda) {
        productos = productos.filter(p => `${p.nombre} ${p.descripcion || ''}`.toLowerCase().includes(busqueda));
    }
    if (orden === 'menor') productos.sort((a, b) => Number(a.precio) - Number(b.precio));
    if (orden === 'mayor') productos.sort((a, b) => Number(b.precio) - Number(a.precio));

    const total = document.getElementById('totalProductosLanding');
    const resumen = document.getElementById('resumenProductosLanding');
    if (total) total.textContent = productos.length;
    if (resumen) resumen.textContent = `Mostrando ${productos.length} producto${productos.length === 1 ? '' : 's'}`;
    let html = '';

    if (productos.length === 0) {
        html = `<div class="sin-resultados" style="grid-column: 1/-1;"><h3>No hay productos disponibles aún.</h3><p>Pronto agregaremos nuevos equipos tecnológicos.</p></div>`;
    } else {
        productos.forEach(p => {
            const stockNum = Number(p.stock);
            const agotado = stockNum <= 0;
            const stockBajo = !agotado && stockNum <= UMBRAL_STOCK_BAJO;
            let stockTexto = '';
            if (agotado) {
                stockTexto = '<span class="badge badge-peligro"><i class="fa-solid fa-ban"></i> Agotado</span>';
            } else if (stockBajo) {
                stockTexto = `<span class="badge badge-stock-alerta badge-alerta-parpadeo"><i class="fa-solid fa-triangle-exclamation"></i> ¡Stock Bajo: ${stockNum} unids!</span>`;
            } else {
                stockTexto = `<span class="badge badge-exito">Stock: ${stockNum} unids</span>`;
            }
            html += `
                <div class="tarjeta-producto">
                    <div class="badge-stock-top">${stockTexto}</div>
                    <div class="img-contenedor">
                        <img src="${p.imagen}" alt="${p.nombre}">
                    </div>
                    <div class="cuerpo-tarjeta">
                        <h3>${p.nombre}</h3>
                        <p class="desc-corta">${p.descripcion || 'Equipo tecnológico con garantía.'}</p>
                        <div class="precio-box">
                            <span class="simbolo-precio">$</span>
                            <span class="monto-precio">${Number(p.precio).toFixed(2)}</span>
                        </div>
                        <div class="acciones-tarjeta">
                            <button class="btn-principal" onclick="verDetalleProductoLanding(${p.id})">
                                <i class="fa-solid fa-circle-info"></i> Ver más detalles
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    grid.innerHTML = html;
}

function verDetalleProductoLanding(idProd) {
    DB = obtenerDB();
    const producto = DB.productos.find(p => p.id === idProd);
    const modal = document.getElementById('modalDetalleProducto');
    if (!producto || !modal) return;

    const stockNum = Number(producto.stock);
    const agotado = stockNum <= 0;
    const stockBajo = !agotado && stockNum <= UMBRAL_STOCK_BAJO;
    document.getElementById('detalleProductoImagen').src = producto.imagen;
    document.getElementById('detalleProductoImagen').alt = producto.nombre;
    document.getElementById('detalleProductoNombre').textContent = producto.nombre;
    document.getElementById('detalleProductoDescripcion').textContent = producto.descripcion || 'Equipo tecnológico con garantía oficial.';
    document.getElementById('detalleProductoPrecio').textContent = `$${Number(producto.precio).toFixed(2)}`;

    let stockMensaje = agotado
        ? 'Agotado'
        : stockBajo
            ? `¡Alerta de Stock Bajo! Solo quedan ${stockNum} unidades disponibles`
            : `${producto.stock} unidades disponibles`;
    document.getElementById('detalleProductoStock').innerHTML = stockMensaje;
    document.getElementById('detalleProductoProveedor').textContent = producto.proveedor || 'Proveedor verificado';

    const botonCompra = document.getElementById('btnComprarDetalle');
    if (botonCompra) {
        botonCompra.disabled = agotado;
        botonCompra.classList.toggle('btn-deshabilitado', agotado);
        botonCompra.innerHTML = agotado
            ? '<i class="fa-solid fa-ban"></i> Producto agotado'
            : '<i class="fa-solid fa-cart-plus"></i> Comprar ahora';
        botonCompra.onclick = () => iniciarCompraLanding(producto.id);
    }

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function cerrarDetalleProductoLanding() {
    const modal = document.getElementById('modalDetalleProducto');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

function alternarMenuCategoriasLanding() {
    const menu = document.getElementById('navCategoriasLanding');
    if (menu) menu.classList.toggle('abierto');
}

function iniciarCompraLanding(idProd) {
    const producto = DB.productos.find(p => p.id === idProd);
    if (!producto || producto.stock <= 0) return;

    const sesion = obtenerSesion();
    if (!sesion || sesion.tipo !== 'cliente') {
        cerrarDetalleProductoLanding();
        mostrarRegistro();
        return;
    }

    cerrarDetalleProductoLanding();
    agregarAlCarritoCliente(idProd);
    setTimeout(() => { window.location.href = 'cliente.html'; }, 500);
}

function renderCatalogoCliente() {
    DB = obtenerDB();
    const grid = document.getElementById('gridCatalogoCliente');
    if (!grid) return;

    const filtroCat = document.getElementById('filtroCatCliente')?.value || '';
    const busqueda = document.getElementById('buscarProdCliente')?.value.toLowerCase() || '';

    let productos = DB.productos;

    if (filtroCat) {
        productos = productos.filter(p => p.categoria === parseInt(filtroCat));
    }

    if (busqueda) {
        productos = productos.filter(p => p.nombre.toLowerCase().includes(busqueda) || (p.descripcion && p.descripcion.toLowerCase().includes(busqueda)));
    }

    let html = '';
    if (productos.length === 0) {
        html = `
            <div class="sin-resultados" style="grid-column: 1/-1;">
                <i class="fa-solid fa-box-open" style="font-size:48px; color:#cbd5e1; margin-bottom:15px;"></i>
                <h3>No se encontraron equipos tecnológicos</h3>
                <p>Intente con otro término de búsqueda o seleccione otra categoría.</p>
            </div>
        `;
    } else {
        productos.forEach(p => {
            const stockNum = Number(p.stock);
            const agotado = stockNum <= 0;
            const stockBajo = !agotado && stockNum <= UMBRAL_STOCK_BAJO;
            let stockTexto = '';
            if (agotado) {
                stockTexto = '<span class="badge badge-peligro"><i class="fa-solid fa-ban"></i> Agotado</span>';
            } else if (stockBajo) {
                stockTexto = `<span class="badge badge-stock-alerta badge-alerta-parpadeo"><i class="fa-solid fa-triangle-exclamation"></i> ¡Stock Bajo: ${stockNum} unids!</span>`;
            } else {
                stockTexto = `<span class="badge badge-exito">Stock: ${stockNum} unids</span>`;
            }

            const msjWa = encodeURIComponent(`Hola TechStore EC, me interesa consultar disponibilidad del producto: ${p.nombre} (Precio: $${p.precio.toFixed(2)})`);
            const urlWaProducto = `https://wa.me/5930980790362?text=${msjWa}`;

            html += `
                <div class="tarjeta-producto">
                    <div class="badge-stock-top">${stockTexto}</div>
                    <div class="img-contenedor">
                        <img src="${p.imagen}" alt="${p.nombre}">
                    </div>
                    <div class="cuerpo-tarjeta">
                        <h3>${p.nombre}</h3>
                        <p class="desc-corta">${p.descripcion || 'Equipo de alta tecnología con garantía de 1 año.'}</p>
                        <div class="precio-box">
                            <span class="simbolo-precio">$</span>
                            <span class="monto-precio">${p.precio.toFixed(2)}</span>
                        </div>
                        <div class="acciones-tarjeta">
                            <button class="btn-principal ${agotado ? 'btn-deshabilitado' : ''}" ${agotado ? 'disabled' : ''} onclick="agregarAlCarritoCliente(${p.id})">
                                <i class="fa-solid fa-cart-plus"></i> Agregar
                            </button>
                            <a href="${urlWaProducto}" target="_blank" class="btn-wa-icon" title="Consultar por WhatsApp +593 0980790362">
                                <i class="fa-brands fa-whatsapp"></i>
                            </a>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    grid.innerHTML = html;
}

// Carrito de compras en el Cliente
function agregarAlCarritoCliente(idProd) {
    DB = obtenerDB();
    const prod = DB.productos.find(p => p.id === idProd);
    if (!prod) return;

    if (prod.stock <= 0) {
        mostrarNotificacion('El producto seleccionado no tiene stock disponible.', 'error');
        return;
    }

    // Buscar si ya está en el carrito
    const itemEnCarrito = DB.carrito.find(item => item.id === idProd);
    if (itemEnCarrito) {
        if (itemEnCarrito.cantidad >= prod.stock) {
            mostrarNotificacion(`No puedes agregar más de ${prod.stock} unidades de este producto.`, 'error');
            return;
        }
        itemEnCarrito.cantidad += 1;
    } else {
        DB.carrito.push({
            id: prod.id,
            nombre: prod.nombre,
            precio: prod.precio,
            imagen: prod.imagen,
            cantidad: 1
        });
    }

    guardarDB(DB);
    mostrarNotificacion(`"${prod.nombre}" agregado al carrito.`, 'exito');
    actualizarBadgesCarrito();
}

function actualizarBadgesCarrito() {
    DB = obtenerDB();
    const totalItems = DB.carrito.reduce((acc, item) => acc + item.cantidad, 0);

    document.querySelectorAll('.badge-count-carrito').forEach(b => {
        b.innerText = totalItems;
    });
}

function abrirDrawerCarrito() {
    DB = obtenerDB();
    const drawer = document.getElementById('drawerCarrito');
    const contenido = document.getElementById('elementosCarritoDrawer');
    const totalEl = document.getElementById('totalMontoCarrito');
    const subtotalEl = document.getElementById('subtotalMontoCarrito');
    const ivaEl = document.getElementById('ivaMontoCarrito');

    if (!drawer) return;

    let html = '';
    let subtotal = 0;

    if (DB.carrito.length === 0) {
        html = `
            <div class="carrito-vacio">
                <i class="fa-solid fa-cart-arrow-down" style="font-size:48px; color:#cbd5e1;"></i>
                <p>Tu carrito de compras está vacío.</p>
            </div>
        `;
    } else {
        DB.carrito.forEach((item, index) => {
            const totalLinea = item.precio * item.cantidad;
            subtotal += totalLinea;

            html += `
                <div class="item-carrito-row">
                    <img src="${item.imagen}" alt="${item.nombre}">
                    <div class="info-item-car">
                        <h4>${item.nombre}</h4>
                        <span class="precio-unit">$${item.precio.toFixed(2)} c/u</span>
                        <div class="control-cantidad">
                            <button onclick="modificarCantidadCarrito(${index}, -1)">-</button>
                            <span>${item.cantidad}</span>
                            <button onclick="modificarCantidadCarrito(${index}, 1)">+</button>
                        </div>
                    </div>
                    <div class="total-item-car">
                        <strong>$${totalLinea.toFixed(2)}</strong>
                        <button class="btn-eliminar-item" onclick="eliminarItemCarrito(${index})"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                </div>
            `;
        });
    }

    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    if (contenido) contenido.innerHTML = html;
    if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
    if (ivaEl) ivaEl.innerText = `$${iva.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `$${total.toFixed(2)}`;

    drawer.classList.add('abierto');
}

function cerrarDrawerCarrito() {
    const drawer = document.getElementById('drawerCarrito');
    if (drawer) drawer.classList.remove('abierto');
}

function modificarCantidadCarrito(index, cambio) {
    DB = obtenerDB();
    const item = DB.carrito[index];
    if (!item) return;

    const prodOriginal = DB.productos.find(p => p.id === item.id);

    if (cambio > 0 && prodOriginal && item.cantidad >= prodOriginal.stock) {
        mostrarNotificacion(`Límite de stock alcanzado (${prodOriginal.stock} unids).`, 'error');
        return;
    }

    item.cantidad += cambio;
    if (item.cantidad <= 0) {
        DB.carrito.splice(index, 1);
    }

    guardarDB(DB);
    actualizarBadgesCarrito();
    abrirDrawerCarrito();
}

function eliminarItemCarrito(index) {
    DB = obtenerDB();
    DB.carrito.splice(index, 1);
    guardarDB(DB);
    actualizarBadgesCarrito();
    abrirDrawerCarrito();
}

// --- LÓGICA DE PANTALLAS Y MÉTODOS DE PAGO INDIVIDUALES ---

function cerrarTodosModalesPago() {
    ['modalCheckoutSelector', 'modalPagoTarjeta', 'modalPagoTransferencia', 'modalPagoEfectivo'].forEach(id => {
        const modal = document.getElementById(id);
        if (modal) modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

function procesarCheckoutModal() {
    DB = obtenerDB();
    if (DB.carrito.length === 0) {
        mostrarNotificacion('Agrega productos al carrito antes de finalizar la compra.', 'error');
        return;
    }

    const sesion = obtenerSesion();
    if (!sesion || sesion.tipo !== 'cliente') {
        mostrarNotificacion('Debe iniciar sesión como cliente para realizar la compra.', 'error');
        mostrarRegistro();
        return;
    }

    cerrarDrawerCarrito();
    cerrarTodosModalesPago();

    // Calcular total
    const subtotal = DB.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    const total = subtotal * 1.15;

    const totalSelector = document.getElementById('totalCheckoutSelector');
    if (totalSelector) totalSelector.textContent = `$${total.toFixed(2)}`;

    const modalSelector = document.getElementById('modalCheckoutSelector');
    if (modalSelector) {
        modalSelector.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function abrirSelectorPago() {
    cerrarTodosModalesPago();
    const modalSelector = document.getElementById('modalCheckoutSelector');
    if (modalSelector) {
        modalSelector.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function abrirPantallaPago(metodo) {
    DB = obtenerDB();
    if (DB.carrito.length === 0) {
        mostrarNotificacion('Tu carrito está vacío.', 'error');
        return;
    }

    cerrarTodosModalesPago();
    const sesion = obtenerSesion() || {};

    const subtotal = DB.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    const iva = subtotal * 0.15;
    const total = subtotal + iva;

    // Generar mini lista de productos para el resumen lateral
    let miniItemsHtml = '';
    DB.carrito.forEach(item => {
        miniItemsHtml += `
            <div class="mini-item-pago">
                <span>${item.nombre} (x${item.cantidad})</span>
                <strong>$${(item.precio * item.cantidad).toFixed(2)}</strong>
            </div>
        `;
    });

    if (metodo === 'tarjeta') {
        const modal = document.getElementById('modalPagoTarjeta');
        if (!modal) return;

        document.getElementById('listaProductosResumenTarjeta').innerHTML = miniItemsHtml;
        document.getElementById('subtotalTarjeta').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('ivaTarjeta').textContent = `$${iva.toFixed(2)}`;
        document.getElementById('totalTarjeta').textContent = `$${total.toFixed(2)}`;
        document.getElementById('montoBotonTarjeta').textContent = `$${total.toFixed(2)}`;

        if (sesion.nombre) {
            document.getElementById('tarjetaNombre').value = sesion.nombre.toUpperCase();
        }
        if (sesion.direccion) {
            document.getElementById('tarjetaDireccion').value = sesion.direccion;
        }

        actualizarPreviewTarjeta();
        calcularDiferidoTarjeta();
        modal.style.display = 'flex';
    } else if (metodo === 'transferencia') {
        const modal = document.getElementById('modalPagoTransferencia');
        if (!modal) return;

        document.getElementById('listaProductosResumenTransferencia').innerHTML = miniItemsHtml;
        document.getElementById('subtotalTransferencia').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('ivaTransferencia').textContent = `$${iva.toFixed(2)}`;
        document.getElementById('totalTransferencia').textContent = `$${total.toFixed(2)}`;
        document.getElementById('montoBotonTransferencia').textContent = `$${total.toFixed(2)}`;

        if (sesion.nombre) {
            document.getElementById('transferenciaTitular').value = sesion.nombre;
        }
        if (sesion.direccion) {
            document.getElementById('transferenciaDireccion').value = sesion.direccion;
        }

        modal.style.display = 'flex';
    } else if (metodo === 'efectivo') {
        const modal = document.getElementById('modalPagoEfectivo');
        if (!modal) return;

        document.getElementById('listaProductosResumenEfectivo').innerHTML = miniItemsHtml;
        document.getElementById('subtotalEfectivo').textContent = `$${subtotal.toFixed(2)}`;
        document.getElementById('ivaEfectivo').textContent = `$${iva.toFixed(2)}`;
        document.getElementById('totalEfectivo').textContent = `$${total.toFixed(2)}`;
        document.getElementById('montoBotonEfectivo').textContent = `$${total.toFixed(2)}`;

        if (sesion.direccion) {
            document.getElementById('efectivoDireccion').value = sesion.direccion;
        }
        if (sesion.telefono) {
            document.getElementById('efectivoTelefono').value = sesion.telefono;
        }

        const montoSugerido = Math.ceil(total / 10) * 10;
        document.getElementById('efectivoMontoConQuePaga').value = montoSugerido.toFixed(2);
        calcularCambioEfectivo();

        modal.style.display = 'flex';
    }

    document.body.style.overflow = 'hidden';
}

function toggleFacturaGenerico(tipo) {
    let check, box, n, r, d;
    if (tipo === 'tarjeta') {
        check = document.getElementById('tarjetaFacturaCheck');
        box = document.getElementById('boxFacturaTarjeta');
        n = document.getElementById('tarjetaFacturaNombre');
        r = document.getElementById('tarjetaFacturaRuc');
        d = document.getElementById('tarjetaFacturaDireccion');
    } else if (tipo === 'transferencia') {
        check = document.getElementById('transferenciaFacturaCheck');
        box = document.getElementById('boxFacturaTransferencia');
        n = document.getElementById('transferenciaFacturaNombre');
        r = document.getElementById('transferenciaFacturaRuc');
        d = document.getElementById('transferenciaFacturaDireccion');
    } else if (tipo === 'efectivo') {
        check = document.getElementById('efectivoFacturaCheck');
        box = document.getElementById('boxFacturaEfectivo');
        n = document.getElementById('efectivoFacturaNombre');
        r = document.getElementById('efectivoFacturaRuc');
        d = document.getElementById('efectivoFacturaDireccion');
    }

    if (check && box) {
        const show = check.checked;
        box.style.display = show ? 'block' : 'none';
        if (n) n.required = show;
        if (r) r.required = show;
        if (d) d.required = show;
    }
}

function copiarAlPortapapeles(texto, nombre) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(texto);
        mostrarNotificacion(`¡${nombre} (${texto}) copiado al portapapeles!`, 'exito');
    } else {
        const input = document.createElement('input');
        input.value = texto;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        mostrarNotificacion(`¡${nombre} (${texto}) copiado al portapapeles!`, 'exito');
    }
}

function actualizarPreviewTarjeta() {
    const rawVal = document.getElementById('tarjetaNumero')?.value || '';
    const cleanDigits = rawVal.replace(/\D/g, '').substring(0, 16);

    let formatted = '';
    for (let i = 0; i < cleanDigits.length; i++) {
        if (i > 0 && i % 4 === 0) formatted += ' ';
        formatted += cleanDigits[i];
    }

    const inputNumero = document.getElementById('tarjetaNumero');
    if (inputNumero) inputNumero.value = formatted;

    const displayNumero = document.getElementById('previewNumeroTarjeta');
    if (displayNumero) {
        displayNumero.textContent = formatted.padEnd(19, '•');
    }

    const inputNombre = document.getElementById('tarjetaNombre')?.value.trim() || 'NOMBRE DEL TITULAR';
    const displayNombre = document.getElementById('previewNombreTarjeta');
    if (displayNombre) displayNombre.textContent = inputNombre.toUpperCase();

    let rawExp = document.getElementById('tarjetaExp')?.value.replace(/\D/g, '') || '';
    if (rawExp.length >= 2) {
        rawExp = rawExp.substring(0, 2) + '/' + rawExp.substring(2, 4);
    }
    const inputExp = document.getElementById('tarjetaExp');
    if (inputExp) inputExp.value = rawExp;

    const displayExp = document.getElementById('previewExpTarjeta');
    if (displayExp) displayExp.textContent = rawExp || 'MM/AA';

    const logoContainer = document.getElementById('previewBrandLogo');
    const inputIcon = document.getElementById('iconoCardInput');

    let brandIcon = '<i class="fa-brands fa-cc-visa"></i>';
    if (cleanDigits.startsWith('51') || cleanDigits.startsWith('52') || cleanDigits.startsWith('53') || cleanDigits.startsWith('54') || cleanDigits.startsWith('55')) {
        brandIcon = '<i class="fa-brands fa-cc-mastercard" style="color:#eb001b;"></i>';
    } else if (cleanDigits.startsWith('34') || cleanDigits.startsWith('37')) {
        brandIcon = '<i class="fa-brands fa-cc-amex" style="color:#007bc1;"></i>';
    } else if (cleanDigits.startsWith('36') || cleanDigits.startsWith('38')) {
        brandIcon = '<i class="fa-brands fa-cc-diners-club" style="color:#0079be;"></i>';
    }

    if (logoContainer) logoContainer.innerHTML = brandIcon;
    if (inputIcon) inputIcon.innerHTML = brandIcon;
}

function calcularDiferidoTarjeta() {
    DB = obtenerDB();
    const subtotal = DB.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    const total = subtotal * 1.15;
    const cuotas = parseInt(document.getElementById('tarjetaCuotas')?.value || 1);

    const valCuota = total / cuotas;
    const cuotaEl = document.getElementById('cuotaEstimadaTarjeta');
    if (cuotaEl) {
        cuotaEl.textContent = `$${valCuota.toFixed(2)} / mes (${cuotas} ${cuotas === 1 ? 'cuota' : 'cuotas'})`;
    }
}

function setBilletesEfectivo(val) {
    DB = obtenerDB();
    const subtotal = DB.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    const total = subtotal * 1.15;

    const input = document.getElementById('efectivoMontoConQuePaga');
    if (!input) return;

    if (val === 'exacto') {
        input.value = total.toFixed(2);
    } else {
        input.value = parseFloat(val).toFixed(2);
    }
    calcularCambioEfectivo();
}

function calcularCambioEfectivo() {
    DB = obtenerDB();
    const subtotal = DB.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
    const total = subtotal * 1.15;

    const montoPaga = parseFloat(document.getElementById('efectivoMontoConQuePaga')?.value || 0);
    const cambio = montoPaga - total;

    const elMontoCambio = document.getElementById('montoCambioEfectivo');
    const elMensajeCambio = document.getElementById('mensajeCambioEfectivo');

    if (montoPaga <= 0) {
        if (elMontoCambio) {
            elMontoCambio.textContent = '$0.00';
            elMontoCambio.style.color = 'var(--text-main)';
        }
        if (elMensajeCambio) elMensajeCambio.textContent = 'Ingrese el monto exacto o billete con el que abonará.';
    } else if (cambio < 0) {
        if (elMontoCambio) {
            elMontoCambio.textContent = 'Monto insuficiente';
            elMontoCambio.style.color = 'var(--danger)';
        }
        if (elMensajeCambio) elMensajeCambio.textContent = `El monto abonado es inferior al total del pedido ($${total.toFixed(2)}).`;
    } else {
        if (elMontoCambio) {
            elMontoCambio.textContent = `$${cambio.toFixed(2)}`;
            elMontoCambio.style.color = 'var(--success)';
        }
        if (elMensajeCambio) elMensajeCambio.textContent = `El repartidor llevará $${cambio.toFixed(2)} de vuelto exacto en efectivo.`;
    }
}

// Event Listeners para formularios de pago
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('formPagoTarjeta')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        await procesarPagoFinal('Tarjeta de Crédito / Débito', {
            numero_mascarado: '•••• •••• •••• ' + (document.getElementById('tarjetaNumero').value.replace(/\D/g, '').slice(-4) || '0000'),
            titular: document.getElementById('tarjetaNombre').value.trim(),
            expiracion: document.getElementById('tarjetaExp').value.trim(),
            cuotas: document.getElementById('tarjetaCuotas').value + ' cuota(s)',
            direccion_entrega: document.getElementById('tarjetaDireccion').value.trim()
        }, 'tarjeta');
    });

    document.getElementById('formPagoTransferencia')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        await procesarPagoFinal('Transferencia Bancaria Directa', {
            banco_origen: document.getElementById('transferenciaBanco').value,
            numero_comprobante: document.getElementById('transferenciaComprobante').value.trim(),
            titular_emisor: document.getElementById('transferenciaTitular').value.trim(),
            ruc_emisor: document.getElementById('transferenciaRuc').value.trim(),
            direccion_entrega: document.getElementById('transferenciaDireccion').value.trim()
        }, 'transferencia');
    });

    document.getElementById('formPagoEfectivo')?.addEventListener('submit', async function (e) {
        e.preventDefault();
        DB = obtenerDB();
        const subtotal = DB.carrito.reduce((acc, i) => acc + (i.precio * i.cantidad), 0);
        const total = subtotal * 1.15;
        const montoPaga = parseFloat(document.getElementById('efectivoMontoConQuePaga').value || 0);

        if (montoPaga < total) {
            mostrarNotificacion(`El dinero abonado ($${montoPaga.toFixed(2)}) debe ser mayor o igual al total del pedido ($${total.toFixed(2)}).`, 'error');
            return;
        }

        const cambio = montoPaga - total;

        await procesarPagoFinal('Pago Contra Entrega en Efectivo', {
            direccion_entrega: document.getElementById('efectivoDireccion').value.trim(),
            telefono_contacto: document.getElementById('efectivoTelefono').value.trim(),
            monto_abonado: `$${montoPaga.toFixed(2)}`,
            vuelto_estimado: `$${cambio.toFixed(2)}`,
            horario_preferido: document.getElementById('efectivoHorario').value,
            notas_entrega: document.getElementById('efectivoNotas').value.trim()
        }, 'efectivo');
    });
});

async function procesarPagoFinal(nombreMetodo, datosEspecificos, tipoClave) {
    DB = obtenerDB();
    const sesion = obtenerSesion();

    if (!sesion) {
        mostrarNotificacion('Debe iniciar sesión para realizar la compra.', 'error');
        return;
    }

    let requiereFactura = false;
    let factura = null;

    if (tipoClave === 'tarjeta') {
        requiereFactura = document.getElementById('tarjetaFacturaCheck')?.checked || false;
        if (requiereFactura) {
            factura = {
                nombre: document.getElementById('tarjetaFacturaNombre').value.trim(),
                ruc: document.getElementById('tarjetaFacturaRuc').value.trim(),
                direccion: document.getElementById('tarjetaFacturaDireccion').value.trim()
            };
        }
    } else if (tipoClave === 'transferencia') {
        requiereFactura = document.getElementById('transferenciaFacturaCheck')?.checked || false;
        if (requiereFactura) {
            factura = {
                nombre: document.getElementById('transferenciaFacturaNombre').value.trim(),
                ruc: document.getElementById('transferenciaFacturaRuc').value.trim(),
                direccion: document.getElementById('transferenciaFacturaDireccion').value.trim()
            };
        }
    } else if (tipoClave === 'efectivo') {
        requiereFactura = document.getElementById('efectivoFacturaCheck')?.checked || false;
        if (requiereFactura) {
            factura = {
                nombre: document.getElementById('efectivoFacturaNombre').value.trim(),
                ruc: document.getElementById('efectivoFacturaRuc').value.trim(),
                direccion: document.getElementById('efectivoFacturaDireccion').value.trim()
            };
        }
    }

    if (requiereFactura && (!factura.nombre || !factura.ruc || !factura.direccion)) {
        mostrarNotificacion('Completa los datos de facturación para proceder.', 'error');
        return;
    }

    try {
        await solicitarAPI('ventas', 'crear', {
            cliente_id: sesion.id,
            cliente_nombre: sesion.nombre,
            metodo_pago: nombreMetodo,
            requiere_factura: requiereFactura,
            factura: factura,
            datos_pago: datosEspecificos,
            productos: DB.carrito
        });

        DB.carrito = [];
        await cargarDBDesdeAPI();
        cerrarTodosModalesPago();
        actualizarBadgesCarrito();
        mostrarNotificacion(`¡Pedido por ${nombreMetodo} realizado con éxito!`, 'exito');
        mostrarSeccionClienteView('miscompras');
        renderMisComprasCliente();
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
}

function renderMisComprasCliente() {
    DB = obtenerDB();
    const sesion = obtenerSesion();
    const tbody = document.querySelector('#tablaMisComprasCliente tbody');
    if (!tbody || !sesion) return;

    const misVentas = DB.ventas.filter(v => v.clienteId === sesion.id || v.cliente === sesion.nombre);

    let html = '';
    if (misVentas.length === 0) {
        html = `<tr><td colspan="6" class="text-center">No has realizado ninguna compra todavía.</td></tr>`;
    } else {
        misVentas.reverse().forEach(v => {
            const badgeClass = v.estado === 'Entregado' ? 'badge-exito' : v.estado === 'Enviado' ? 'badge-info' : 'badge-advertencia';
            html += `
                <tr>
                    <td><strong>#${v.id}</strong></td>
                    <td>${v.fecha}</td>
                    <td>${v.productos.length} ítems</td>
                    <td><strong>$${v.total.toFixed(2)}</strong></td>
                    <td><span class="badge ${badgeClass}">${v.estado}</span></td>
                    <td>
                        <button class="btn-secundario btn-sm" onclick="verDetalleVentaAdmin(${v.id})"><i class="fa-solid fa-receipt"></i> Ver Ver de Recibo</button>
                    </td>
                </tr>
            `;
        });
    }
    tbody.innerHTML = html;
}

function mostrarSeccionClienteView(idSeccion, elNav = null) {
    document.querySelectorAll('.seccion-cliente-view').forEach(s => s.classList.add('oculto'));
    const secTarget = document.getElementById(idSeccion);
    if (secTarget) secTarget.classList.remove('oculto');

    if (elNav) {
        document.querySelectorAll('.nav-link-cliente').forEach(a => a.classList.remove('activo'));
        elNav.classList.add('activo');
    }

    if (idSeccion === 'tienda') renderCatalogoCliente();
    if (idSeccion === 'miscompras') renderMisComprasCliente();
}


// ==========================================
// LÓGICA DE PROVEEDORES (proveedores.html)
// ==========================================

function inicializarProveedores() {
    verificarGuardiaRutal();
    DB = obtenerDB();
    renderTablaProveedores();
    cargarSelectProveedores();
    renderHistorialComprasStock();
}

function inicializarFormularioProveedor() {
    verificarGuardiaRutal();
    const id = parseInt(new URLSearchParams(window.location.search).get('id'));
    if (!id) return;
    DB = obtenerDB();
    const proveedor = DB.proveedores.find(item => item.id === id);
    if (!proveedor) return;
    document.getElementById('idProveedor').value = proveedor.id;
    document.getElementById('provNombre').value = proveedor.nombre || '';
    document.getElementById('provRuc').value = proveedor.ruc || '';
    document.getElementById('provContacto').value = proveedor.contacto || '';
    document.getElementById('provTelefono').value = proveedor.telefono || '';
    document.getElementById('provCorreo').value = proveedor.correo || '';
    document.getElementById('provCiudad').value = proveedor.ciudad || '';
    document.querySelector('h1').innerText = 'Actualizar Proveedor';
    document.getElementById('btnGuardarProveedor').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Actualizar Proveedor';
}

function inicializarFormularioCompraStock() {
    verificarGuardiaRutal();
    cargarSelectProveedores();
    const id = parseInt(new URLSearchParams(window.location.search).get('id'));
    if (!id) return;
    const compra = DB.comprasStock.find(item => item.id === id);
    if (!compra) return;
    document.getElementById('idCompraStock').value = compra.id;
    document.getElementById('compraProveedorSelect').value = compra.proveedor;
    document.getElementById('compraMontoTotal').value = compra.total;
    document.getElementById('compraDetalleText').value = compra.detalle || '';
    document.querySelector('h1').innerText = 'Actualizar Ingreso de Stock';
    document.getElementById('btnGuardarCompraStock').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Actualizar Ingreso';
}

function cargarSelectProveedores() {
    const select = document.getElementById('compraProveedorSelect');
    if (!select) return;
    select.innerHTML = DB.proveedores.map(proveedor =>
        `<option value="${proveedor.nombre}">${proveedor.nombre}</option>`
    ).join('');
}

function renderTablaProveedores() {
    DB = obtenerDB();
    const tbody = document.querySelector('#tablaProveedores tbody');
    if (!tbody) return;

    let html = '';
    DB.proveedores.forEach(p => {
        html += `
            <tr>
                <td>#${p.id}</td>
                <td><strong>${p.nombre}</strong></td>
                <td>${p.ruc}</td>
                <td>${p.contacto}</td>
                <td>${p.telefono}<br><small class="text-muted">${p.correo}</small></td>
                <td>${p.ciudad}</td>
                    <td>
                        <div class="acciones-btn">
                            <button class="btn-icon btn-editar" onclick="prepararEditarProveedor(${p.id})" title="Actualizar"><i class="fa-solid fa-pen-to-square"></i></button>
                            <button class="btn-icon btn-eliminar" onclick="eliminarProveedor(${p.id})" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

document.getElementById('formProveedor')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    DB = obtenerDB();

    const sesion = obtenerSesion();
    if (!sesion || sesion.tipo !== 'admin') {
        mostrarNotificacion('Acceso restringido. Solo administradores pueden agregar proveedores.', 'error');
        return;
    }

    const id = document.getElementById('idProveedor').value;
    const nombre = document.getElementById('provNombre').value.trim();
    const rucRaw = document.getElementById('provRuc').value.trim();
    const provRucDigits = rucRaw.replace(/\D/g, '');
    const contacto = document.getElementById('provContacto').value.trim();
    const telefonoRaw = document.getElementById('provTelefono').value.trim();
    const telefonoDigits = telefonoRaw.replace(/\D/g, '');
    const correo = document.getElementById('provCorreo').value.trim();
    const ciudad = document.getElementById('provCiudad').value.trim();

    if (provRucDigits.length !== 10) {
        mostrarNotificacion('El RUC/Cédula debe contener exactamente 10 dígitos.', 'error');
        return;
    }

    if (telefonoDigits.length !== 10) {
        mostrarNotificacion('El teléfono debe contener exactamente 10 dígitos.', 'error');
        return;
    }

    try {
        await solicitarAPI('proveedores', id ? 'editar' : 'crear', {
            id: id ? parseInt(id) : undefined,
            nombre, ruc: provRucDigits, contacto, telefono: telefonoDigits, correo, ciudad
        });
        await cargarDBDesdeAPI();
        mostrarNotificacion(id ? 'Proveedor actualizado correctamente.' : 'Proveedor agregado con éxito.', 'exito');
        setTimeout(() => { window.location.href = 'proveedores.html'; }, 700);
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
});

function prepararEditarProveedor(id) {
    window.location.href = `nuevo-proveedor.html?id=${id}`;
}

function cancelarEditarProveedor() {
    const form = document.getElementById('formProveedor');
    if (!form) return;
    form.reset();
    document.getElementById('idProveedor').value = '';
    document.getElementById('btnGuardarProveedor').innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Guardar Proveedor';
    document.getElementById('btnCancelarEditarProveedor').classList.add('oculto');
}

async function eliminarProveedor(id) {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
        await solicitarAPI('proveedores', 'eliminar', { id });
        await cargarDBDesdeAPI();
        mostrarNotificacion('Proveedor eliminado.', 'exito');
        renderTablaProveedores();
        cargarSelectProveedores();
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
}

function renderHistorialComprasStock() {
    DB = obtenerDB();
    const tbody = document.querySelector('#tablaComprasStock tbody');
    if (!tbody) return;

    let html = '';
    DB.comprasStock.forEach(c => {
        html += `
            <tr>
                <td>#${c.id}</td>
                <td><strong>${c.proveedor}</strong></td>
                <td>${c.fecha}</td>
                <td>${c.detalle}</td>
                <td><strong>$${c.total.toFixed(2)}</strong></td>
                <td><span class="badge badge-exito">${c.estado}</span></td>
                <td>
                    <div class="acciones-btn">
                        <button class="btn-icon btn-editar" onclick="prepararEditarCompraStock(${c.id})" title="Actualizar"><i class="fa-solid fa-pen-to-square"></i></button>
                        <button class="btn-icon btn-eliminar" onclick="eliminarCompraStock(${c.id})" title="Eliminar"><i class="fa-solid fa-trash-can"></i></button>
                    </div>
                </td>
            </tr>
        `;
    });
    tbody.innerHTML = html;
}

document.getElementById('formCompraStock')?.addEventListener('submit', async function (e) {
    e.preventDefault();
    DB = obtenerDB();

    try {
        const id = document.getElementById('idCompraStock').value;
        await solicitarAPI('compras_stock', id ? 'editar' : 'crear', {
            id: id ? parseInt(id) : undefined,
            proveedor_nombre: document.getElementById('compraProveedorSelect').value,
            total: parseFloat(document.getElementById('compraMontoTotal').value),
            detalle: document.getElementById('compraDetalleText').value.trim()
        });
        await cargarDBDesdeAPI();
        mostrarNotificacion(id ? 'Compra de stock actualizada.' : 'Ingreso de stock por compra registrado.', 'exito');
        setTimeout(() => { window.location.href = 'proveedores.html'; }, 700);
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
});

function prepararEditarCompraStock(id) {
    window.location.href = `nuevo-ingreso-stock.html?id=${id}`;
}

function cancelarEditarCompraStock() {
    const form = document.getElementById('formCompraStock');
    if (!form) return;
    form.reset();
    document.getElementById('idCompraStock').value = '';
    document.getElementById('btnGuardarCompraStock').innerHTML = '<i class="fa-solid fa-receipt"></i> Registrar Ingreso de Stock';
    document.getElementById('btnCancelarEditarCompra').classList.add('oculto');
}

async function eliminarCompraStock(id) {
    if (!confirm('¿Eliminar esta compra de stock?')) return;
    try {
        await solicitarAPI('compras_stock', 'eliminar', { id });
        await cargarDBDesdeAPI();
        mostrarNotificacion('Compra de stock eliminada.', 'exito');
        renderHistorialComprasStock();
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
}


// ==========================================
// LÓGICA DE REPORTES (reportes.html)
// ==========================================

function renderizarReportes(reporte) {
    const kpis = reporte?.kpis || {};
    const totalIngresos = Number(kpis.ingresos_totales ?? 0);
    const totalEgresos = Number(kpis.egresos_totales ?? 0);
    const gananciaNeta = Number(kpis.ganancia_neta ?? totalIngresos - totalEgresos);

    if (document.getElementById('repIngresos')) document.getElementById('repIngresos').innerText = `$${totalIngresos.toFixed(2)}`;
    if (document.getElementById('repEgresos')) document.getElementById('repEgresos').innerText = `$${totalEgresos.toFixed(2)}`;
    if (document.getElementById('repGanancia')) {
        const elG = document.getElementById('repGanancia');
        elG.innerText = `$${gananciaNeta.toFixed(2)}`;
        elG.style.color = gananciaNeta >= 0 ? '#16a34a' : '#dc2626';
    }

    const itemsTop = (reporte?.top_productos_vendidos || []).map(item => ({
        nombre: item.nombre_producto || 'Producto sin nombre',
        cantidad: Number(item.unidades_vendidas || 0)
    }));

    const tbodyTop = document.querySelector('#tablaTopVendidos tbody');
    if (tbodyTop) {
        let html = '';
        if (itemsTop.length === 0) {
            html = `<tr><td colspan="3" class="text-center">No hay registros de ventas.</td></tr>`;
        } else {
            itemsTop.forEach((item, index) => {
                html += `
                    <tr>
                        <td><strong>#${index + 1}</strong></td>
                        <td>${item.nombre}</td>
                        <td><span class="badge badge-info">${item.cantidad} unidades</span></td>
                    </tr>
                `;
            });
        }
        tbodyTop.innerHTML = html;
    }
}

function obtenerReporteLocal() {
    verificarGuardiaRutal();
    DB = obtenerDB();

    const totalIngresos = DB.ventas.reduce((acc, v) => acc + v.total, 0);
    const totalEgresos = DB.comprasStock.reduce((acc, c) => acc + c.total, 0);
    const gananciaNeta = totalIngresos - totalEgresos;

    if (document.getElementById('repIngresos')) document.getElementById('repIngresos').innerText = `$${totalIngresos.toFixed(2)}`;
    if (document.getElementById('repEgresos')) document.getElementById('repEgresos').innerText = `$${totalEgresos.toFixed(2)}`;
    if (document.getElementById('repGanancia')) {
        const elG = document.getElementById('repGanancia');
        elG.innerText = `$${gananciaNeta.toFixed(2)}`;
        elG.style.color = gananciaNeta >= 0 ? '#16a34a' : '#dc2626';
    }

    const reporte = {
        kpis: {
            ingresos_totales: totalIngresos,
            egresos_totales: totalEgresos,
            ganancia_neta: gananciaNeta
        },
        top_productos_vendidos: []
    };

    const contador = {};
    DB.ventas.forEach(v => {
        v.productos.forEach(p => {
            const nombre = p.nombre_producto || p.nombre || 'Producto sin nombre';
            contador[nombre] = (contador[nombre] || 0) + (p.cantidad || 1);
        });
    });

    reporte.top_productos_vendidos = Object.keys(contador)
        .map(nombre => ({ nombre_producto: nombre, unidades_vendidas: contador[nombre] }))
        .sort((a, b) => b.unidades_vendidas - a.unidades_vendidas);
    return reporte;
}

async function inicializarReportes() {
    try {
        verificarGuardiaRutal();
        const reporte = await solicitarAPI('reportes', 'resumen');
        renderizarReportes(reporte);
    } catch (error) {
        renderizarReportes(obtenerReporteLocal());
        throw error;
    }
}

async function actualizarReportes() {
    try {
        await cargarDBDesdeAPI();
        const reporte = await solicitarAPI('reportes', 'resumen');
        renderizarReportes(reporte);
        mostrarNotificacion('Reporte actualizado correctamente.', 'exito');
    } catch (error) {
        mostrarNotificacion(error.message, 'error');
    }
}

// Inicialización automática al cargar el DOM
document.addEventListener('DOMContentLoaded', async () => {
    DB = obtenerDB();
    const page = window.location.pathname;

    try {
        await cargarDBDesdeAPI();
    } catch (error) {
        mostrarNotificacion(error.message, 'advertencia');
    }

    if (page.includes('index.html') || page.endsWith('/')) {
        renderCategoriasLanding();
        renderCatalogoLanding();
    }

    if (page.includes('admin.html')) {
        inicializarAdmin();
    } else if (page.includes('cliente.html')) {
        inicializarCliente();
    } else if (page.includes('proveedores.html')) {
        inicializarProveedores();
    } else if (page.includes('reportes.html')) {
        await inicializarReportes();
    } else if (page.includes('nuevo-proveedor.html')) {
        inicializarFormularioProveedor();
    } else if (page.includes('nuevo-ingreso-stock.html')) {
        inicializarFormularioCompraStock();
    } else if (page.includes('nueva-categoria.html')) {
        verificarGuardiaRutal();
    }
});
