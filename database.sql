CREATE DATABASE IF NOT EXISTS equipotechpait DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE equipotechpait;

CREATE USER IF NOT EXISTS 'techstore'@'localhost' IDENTIFIED BY 'TechStore123!';
ALTER USER 'techstore'@'localhost' IDENTIFIED BY 'TechStore123!';
GRANT ALL PRIVILEGES ON equipotechpait.* TO 'techstore'@'localhost';

CREATE USER IF NOT EXISTS 'techstore'@'127.0.0.1' IDENTIFIED BY 'TechStore123!';
ALTER USER 'techstore'@'127.0.0.1' IDENTIFIED BY 'TechStore123!';
GRANT ALL PRIVILEGES ON equipotechpait.* TO 'techstore'@'127.0.0.1';

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario VARCHAR(50) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  tipo ENUM('admin', 'cliente') NOT NULL DEFAULT 'cliente',
  nombre VARCHAR(100) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  telefono VARCHAR(30) DEFAULT NULL,
  direccion TEXT DEFAULT NULL,
  fecha DATE NOT NULL DEFAULT (CURRENT_DATE)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS proveedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL,
  ruc VARCHAR(20) NOT NULL,
  contacto VARCHAR(100) DEFAULT NULL,
  telefono VARCHAR(30) DEFAULT NULL,
  correo VARCHAR(100) DEFAULT NULL,
  ciudad VARCHAR(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  categoria_id INT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  stock INT NOT NULL DEFAULT 0,
  imagen TEXT DEFAULT NULL,
  descripcion TEXT DEFAULT NULL,
  proveedor VARCHAR(100) DEFAULT NULL,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cliente_id INT NOT NULL,
  cliente_nombre VARCHAR(100) NOT NULL,
  fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estado ENUM('Pendiente', 'Enviado', 'Entregado') NOT NULL DEFAULT 'Pendiente',
  metodo_pago VARCHAR(50) DEFAULT 'Transferencia Bancaria',
  factura_requerida TINYINT(1) NOT NULL DEFAULT 0,
  factura_datos JSON DEFAULT NULL,
  FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS detalle_ventas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  venta_id INT NOT NULL,
  producto_id INT NOT NULL,
  nombre_producto VARCHAR(150) NOT NULL,
  cantidad INT NOT NULL DEFAULT 1,
  precio_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (venta_id) REFERENCES ventas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (producto_id) REFERENCES productos(id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS compras_stock (
  id INT AUTO_INCREMENT PRIMARY KEY,
  proveedor_id INT NULL,
  proveedor_nombre VARCHAR(100) NOT NULL,
  fecha DATE NOT NULL DEFAULT (CURRENT_DATE),
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  estado VARCHAR(50) NOT NULL DEFAULT 'Recibido',
  detalle TEXT DEFAULT NULL,
  FOREIGN KEY (proveedor_id) REFERENCES proveedores(id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO usuarios (id, usuario, contrasena, tipo, nombre, correo, telefono, direccion, fecha) VALUES
(1, 'admin', 'admin123', 'admin', 'Administrador General', 'admin@techstore.ec', '+593 0980790362', 'Av. Amazonas N24-15, Quito', '2026-01-10'),
(2, 'cliente', 'cliente123', 'cliente', 'Carlos Mendoza', 'carlos.mendoza@gmail.com', '0991234567', 'Av. Shyris y El Universo, Quito', '2026-02-14'),
(3, 'maria', '1234', 'cliente', 'María Fernanda López', 'maria.lopez@hotmail.com', '0984567890', 'Sector La Carolina, Quito', '2026-03-01')
ON DUPLICATE KEY UPDATE
  usuario = VALUES(usuario),
  contrasena = VALUES(contrasena),
  tipo = VALUES(tipo),
  nombre = VALUES(nombre),
  correo = VALUES(correo),
  telefono = VALUES(telefono),
  direccion = VALUES(direccion),
  fecha = VALUES(fecha);

INSERT INTO categorias (id, nombre, descripcion) VALUES
(1, 'Laptops & Portátiles', 'Equipos portátiles para trabajo, estudio y gaming'),
(2, 'PC Gamer & Desktop', 'Computadoras de escritorio de alto rendimiento'),
(3, 'Monitores & Pantallas', 'Monitores 4K, Curvos y tasa de refresco alta'),
(4, 'Periféricos & Accesorios', 'Teclados mecánicos, mouses gamer, auriculares'),
(5, 'Componentes & Piezas', 'Tarjetas de video GPU, Procesadores CPU, memorias RAM')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO proveedores (id, nombre, ruc, contacto, telefono, correo, ciudad) VALUES
(1, 'ASUS Ecuador S.A.', '1792345678001', 'Ing. Roberto Paz', '022987654', 'ventas@asus.com.ec', 'Quito'),
(2, 'Tech Import Lenovo EC', '1798765432001', 'Lcda. Andrea Ruiz', '042345678', 'contacto@lenovoimport.ec', 'Guayaquil'),
(3, 'Componentes PC Master', '1791122334001', 'David Salazar', '022554433', 'pedidos@pcmaster.ec', 'Quito')
ON DUPLICATE KEY UPDATE id=id;

INSERT INTO productos (id, nombre, categoria_id, precio, stock, imagen, descripcion, proveedor) VALUES
(101, 'Laptop ASUS ROG Strix G16', 1, 1550.00, 8, 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=800', 'Intel i7 13th Gen, 16GB RAM, 512GB SSD RTX 4060', 'ASUS Ecuador'),
(102, 'Laptop Lenovo ThinkPad E14', 1, 780.00, 14, 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800', 'AMD Ryzen 7, 16GB RAM, 512GB SSD', 'Lenovo Corp'),
(103, 'PC Gamer Master RTX 4070 Ti', 2, 2100.00, 4, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?q=80&w=800', 'Intel i9 14900K, 32GB RAM DDR5, 1TB NVMe, RTX 4070Ti', 'PC Assemblers'),
(104, 'Monitor LG UltraGear 27\'\' 165Hz', 3, 340.00, 12, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=800', 'Panel IPS 1ms, QHD 1440p, HDR10 FreeSync', 'LG Electronics'),
(105, 'Teclado Mecánico Redragon Kumara', 4, 55.00, 25, 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?q=80&w=800', 'Switches Red, Iluminación RGB, Anti-ghosting', 'Redragon Direct'),
(106, 'Mouse Gamer Logitech G502 Hero', 4, 68.00, 18, 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=800', 'Sensor HERO 25K, 11 Botones programables', 'Logitech EC'),
(107, 'Tarjeta de Video Nvidia RTX 4080 16GB', 5, 1390.00, 5, 'https://images.unsplash.com/photo-1591488320449-011701bb6704?q=80&w=800', 'GDDR6X, Ray Tracing Gen 3, DLSS 3', 'MSI Tech'),
(108, 'Procesador AMD Ryzen 9 7900X', 5, 490.00, 9, 'https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=800', '12 Núcleos, 24 Hilos, Socket AM5, 5.6GHz Boost', 'AMD Global')
ON DUPLICATE KEY UPDATE id=id;