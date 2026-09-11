<?php
/**
 * API REST de Productos para TechStore EC
 * Compatible con el proyecto actual.
 */
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'listar';
$data = getRequestBody();
$pdo = getDBConnection();

switch ($action) {
    case 'listar':
        $sql = "SELECT p.*, c.nombre AS categoria_nombre
                FROM productos p
                LEFT JOIN categorias c ON p.categoria_id = c.id
                ORDER BY p.id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $productos = $stmt->fetchAll();

        foreach ($productos as &$producto) {
            $producto['id'] = (int)$producto['id'];
            $producto['categoria_id'] = (int)($producto['categoria_id'] ?? 0);
            $producto['precio'] = (float)($producto['precio'] ?? 0);
            $producto['stock'] = (int)($producto['stock'] ?? 0);
        }

        jsonResponse('exito', 'Productos obtenidos correctamente', $productos);
        break;

    case 'obtener':
        $id = intval($_GET['id'] ?? $data['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de producto no válido.', null, 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM productos WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $producto = $stmt->fetch();

        if (!$producto) {
            jsonResponse('error', 'Producto no encontrado.', null, 404);
        }

        $producto['id'] = (int)$producto['id'];
        $producto['categoria_id'] = (int)($producto['categoria_id'] ?? 0);
        $producto['precio'] = (float)($producto['precio'] ?? 0);
        $producto['stock'] = (int)($producto['stock'] ?? 0);

        jsonResponse('exito', 'Producto encontrado', $producto);
        break;

    case 'crear':
        $nombre = trim($data['nombre'] ?? '');
        $categoriaId = intval($data['categoria_id'] ?? 0);
        $precio = floatval($data['precio'] ?? 0);
        $stock = intval($data['stock'] ?? 0);
        $imagen = trim($data['imagen'] ?? '');
        $descripcion = trim($data['descripcion'] ?? '');
        $proveedor = trim($data['proveedor'] ?? '');

        if (empty($nombre) || $categoriaId <= 0) {
            jsonResponse('error', 'Nombre y categoría son obligatorios.', null, 400);
        }

        $stmt = $pdo->prepare("INSERT INTO productos (nombre, categoria_id, precio, stock, imagen, descripcion, proveedor)
                               VALUES (:nombre, :categoria_id, :precio, :stock, :imagen, :descripcion, :proveedor)");
        $stmt->execute([
            ':nombre' => $nombre,
            ':categoria_id' => $categoriaId,
            ':precio' => $precio,
            ':stock' => $stock,
            ':imagen' => $imagen,
            ':descripcion' => $descripcion,
            ':proveedor' => $proveedor
        ]);

        $nuevoId = $pdo->lastInsertId();
        jsonResponse('exito', 'Producto agregado correctamente', ['id' => (int)$nuevoId]);
        break;

    case 'editar':
        $id = intval($data['id'] ?? 0);
        $nombre = trim($data['nombre'] ?? '');
        $categoriaId = intval($data['categoria_id'] ?? 0);
        $precio = floatval($data['precio'] ?? 0);
        $stock = intval($data['stock'] ?? 0);
        $imagen = trim($data['imagen'] ?? '');
        $descripcion = trim($data['descripcion'] ?? '');
        $proveedor = trim($data['proveedor'] ?? '');

        if ($id <= 0 || empty($nombre) || $categoriaId <= 0) {
            jsonResponse('error', 'Faltan datos obligatorios para editar el producto.', null, 400);
        }

        $stmt = $pdo->prepare("UPDATE productos
                               SET nombre = :nombre,
                                   categoria_id = :categoria_id,
                                   precio = :precio,
                                   stock = :stock,
                                   imagen = :imagen,
                                   descripcion = :descripcion,
                                   proveedor = :proveedor
                               WHERE id = :id");
        $stmt->execute([
            ':nombre' => $nombre,
            ':categoria_id' => $categoriaId,
            ':precio' => $precio,
            ':stock' => $stock,
            ':imagen' => $imagen,
            ':descripcion' => $descripcion,
            ':proveedor' => $proveedor,
            ':id' => $id
        ]);

        jsonResponse('exito', 'Producto actualizado correctamente');
        break;

    case 'eliminar':
        $id = intval($data['id'] ?? $_GET['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de producto no válido.', null, 400);
        }

        $stmt = $pdo->prepare("DELETE FROM productos WHERE id = :id");
        $stmt->execute([':id' => $id]);

        jsonResponse('exito', 'Producto eliminado correctamente');
        break;

    default:
        jsonResponse('error', 'Acción no válida para productos.', null, 400);
        break;
}
