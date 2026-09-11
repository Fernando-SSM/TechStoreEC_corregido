<?php
/**
 * API REST de Gestión de Categorías de Equipos Tecnológicos
 * EquipoTechPAIT / TechStore EC
 */
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'listar';
$data = getRequestBody();
$pdo = getDBConnection();

switch ($action) {
    case 'listar':
        $sql = "SELECT c.*, COUNT(p.id) AS total_productos 
                FROM categorias c 
                LEFT JOIN productos p ON c.id = p.categoria_id 
                GROUP BY c.id 
                ORDER BY c.nombre ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $categorias = $stmt->fetchAll();

        foreach ($categorias as &$cat) {
            $cat['id'] = (int)$cat['id'];
            $cat['total_productos'] = (int)($cat['total_productos'] ?? 0);
        }

        jsonResponse('exito', 'Categorías obtenidas correctamente', $categorias);
        break;

    case 'obtener':
        $id = intval($_GET['id'] ?? $data['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de categoría no válido', null, 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM categorias WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $cat = $stmt->fetch();

        if ($cat) {
            $cat['id'] = (int)$cat['id'];
            jsonResponse('exito', 'Categoría encontrada', $cat);
        } else {
            jsonResponse('error', 'Categoría no encontrada', null, 404);
        }
        break;

    case 'crear':
        $nombre = trim($data['nombre'] ?? '');
        $descripcion = trim($data['descripcion'] ?? '');

        if (empty($nombre)) {
            jsonResponse('error', 'El nombre de la categoría es obligatorio.', null, 400);
        }

        // Verificar si ya existe
        $stmt = $pdo->prepare("SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(:nombre)");
        $stmt->execute([':nombre' => $nombre]);
        if ($stmt->fetch()) {
            jsonResponse('error', 'Ya existe una categoría con ese nombre.', null, 400);
        }

        $stmt = $pdo->prepare("INSERT INTO categorias (nombre, descripcion) VALUES (:nombre, :descripcion)");
        $stmt->execute([
            ':nombre' => $nombre,
            ':descripcion' => $descripcion
        ]);

        $nuevoId = $pdo->lastInsertId();
        jsonResponse('exito', 'Categoría creada exitosamente.', ['id' => (int)$nuevoId]);
        break;

    case 'editar':
        $id = intval($data['id'] ?? 0);
        $nombre = trim($data['nombre'] ?? '');
        $descripcion = trim($data['descripcion'] ?? '');

        if ($id <= 0 || empty($nombre)) {
            jsonResponse('error', 'ID de categoría y nombre son obligatorios.', null, 400);
        }

        $stmt = $pdo->prepare("SELECT id FROM categorias WHERE LOWER(nombre) = LOWER(:nombre) AND id != :id");
        $stmt->execute([':nombre' => $nombre, ':id' => $id]);
        if ($stmt->fetch()) {
            jsonResponse('error', 'Ya existe otra categoría con ese nombre.', null, 400);
        }

        $stmt = $pdo->prepare("UPDATE categorias SET nombre = :nombre, descripcion = :descripcion WHERE id = :id");
        $stmt->execute([
            ':id' => $id,
            ':nombre' => $nombre,
            ':descripcion' => $descripcion
        ]);

        jsonResponse('exito', 'Categoría actualizada correctamente.');
        break;

    case 'eliminar':
        $id = intval($data['id'] ?? $_GET['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de categoría no válido.', null, 400);
        }

        // Verificar si tiene productos asociados
        $stmt = $pdo->prepare("SELECT COUNT(*) AS count FROM productos WHERE categoria_id = :id");
        $stmt->execute([':id' => $id]);
        $count = $stmt->fetch()['count'] ?? 0;

        if ($count > 0) {
            jsonResponse('error', "No se puede eliminar la categoría porque tiene $count producto(s) vinculado(s).", null, 400);
        }

        $stmt = $pdo->prepare("DELETE FROM categorias WHERE id = :id");
        $stmt->execute([':id' => $id]);

        jsonResponse('exito', 'Categoría eliminada del sistema.');
        break;

    default:
        jsonResponse('error', 'Acción no válida en categorías.', null, 400);
        break;
}
?>
