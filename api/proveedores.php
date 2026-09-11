<?php
/**
 * API REST de Gestión de Proveedores Tecnológicos
 * EquipoTechPAIT / TechStore EC
 */
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'listar';
$data = getRequestBody();
$pdo = getDBConnection();

switch ($action) {
    case 'listar':
        $busqueda = trim($_GET['busqueda'] ?? '');
        $sql = "SELECT * FROM proveedores WHERE 1=1";
        $params = [];

        if (!empty($busqueda)) {
            $sql .= " AND (LOWER(nombre) LIKE :busqueda OR LOWER(ruc) LIKE :busqueda OR LOWER(contacto) LIKE :busqueda OR LOWER(ciudad) LIKE :busqueda)";
            $params[':busqueda'] = '%' . strtolower($busqueda) . '%';
        }

        $sql .= " ORDER BY id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $proveedores = $stmt->fetchAll();

        foreach ($proveedores as &$prov) {
            $prov['id'] = (int)$prov['id'];
        }

        jsonResponse('exito', 'Proveedores obtenidos con éxito', $proveedores);
        break;

    case 'obtener':
        $id = intval($_GET['id'] ?? $data['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de proveedor no válido', null, 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM proveedores WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $prov = $stmt->fetch();

        if ($prov) {
            $prov['id'] = (int)$prov['id'];
            jsonResponse('exito', 'Proveedor encontrado', $prov);
        } else {
            jsonResponse('error', 'Proveedor no encontrado', null, 404);
        }
        break;

    case 'crear':
        $nombre = trim($data['nombre'] ?? '');
        $ruc = trim($data['ruc'] ?? '');
        $contacto = trim($data['contacto'] ?? '');
        $telefono = trim($data['telefono'] ?? '');
        $correo = trim($data['correo'] ?? '');
        $ciudad = trim($data['ciudad'] ?? '');

        if (empty($nombre) || empty($ruc)) {
            jsonResponse('error', 'Nombre de la empresa y RUC son campos obligatorios.', null, 400);
        }

        // Verificar RUC único
        $stmt = $pdo->prepare("SELECT id FROM proveedores WHERE ruc = :ruc");
        $stmt->execute([':ruc' => $ruc]);
        if ($stmt->fetch()) {
            jsonResponse('error', 'El RUC ingresado ya pertenece a otro proveedor registrado.', null, 400);
        }

        $sql = "INSERT INTO proveedores (nombre, ruc, contacto, telefono, correo, ciudad) 
                VALUES (:nombre, :ruc, :contacto, :telefono, :correo, :ciudad)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':ruc' => $ruc,
            ':contacto' => $contacto,
            ':telefono' => $telefono,
            ':correo' => $correo,
            ':ciudad' => $ciudad
        ]);

        $nuevoId = $pdo->lastInsertId();
        jsonResponse('exito', 'Proveedor registrado correctamente.', ['id' => (int)$nuevoId]);
        break;

    case 'editar':
        $id = intval($data['id'] ?? 0);
        $nombre = trim($data['nombre'] ?? '');
        $ruc = trim($data['ruc'] ?? '');
        $contacto = trim($data['contacto'] ?? '');
        $telefono = trim($data['telefono'] ?? '');
        $correo = trim($data['correo'] ?? '');
        $ciudad = trim($data['ciudad'] ?? '');

        if ($id <= 0 || empty($nombre) || empty($ruc)) {
            jsonResponse('error', 'ID, Nombre y RUC son requeridos para actualizar.', null, 400);
        }

        $stmt = $pdo->prepare("SELECT id FROM proveedores WHERE ruc = :ruc AND id != :id");
        $stmt->execute([':ruc' => $ruc, ':id' => $id]);
        if ($stmt->fetch()) {
            jsonResponse('error', 'El RUC ingresado ya pertenece a otro proveedor registrado.', null, 400);
        }

        $sql = "UPDATE proveedores 
                SET nombre = :nombre, ruc = :ruc, contacto = :contacto, 
                    telefono = :telefono, correo = :correo, ciudad = :ciudad 
                WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':nombre' => $nombre,
            ':ruc' => $ruc,
            ':contacto' => $contacto,
            ':telefono' => $telefono,
            ':correo' => $correo,
            ':ciudad' => $ciudad
        ]);

        jsonResponse('exito', 'Proveedor actualizado correctamente.');
        break;

    case 'eliminar':
        $id = intval($data['id'] ?? $_GET['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de proveedor no válido.', null, 400);
        }

        $stmt = $pdo->prepare("DELETE FROM proveedores WHERE id = :id");
        $stmt->execute([':id' => $id]);

        jsonResponse('exito', 'Proveedor eliminado.');
        break;

    default:
        jsonResponse('error', 'Acción no reconocida para proveedores.', null, 400);
        break;
}
?>
