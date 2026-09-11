<?php
/**
 * API de Clientes (compatibilidad con el esquema actual del proyecto)
 * Soporta usuarios tipo cliente y mantiene compatibilidad con el nombre clientes.
 */
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'listar';
$data = getRequestBody();
$pdo = getDBConnection();

switch ($action) {
    case 'listar':
        $sql = "SELECT id, usuario, tipo, nombre, correo, telefono, direccion, fecha
                FROM usuarios
                WHERE tipo = 'cliente'
                ORDER BY id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $clientes = $stmt->fetchAll();

        foreach ($clientes as &$cliente) {
            $cliente['id'] = (int)$cliente['id'];
        }

        jsonResponse('exito', 'Clientes obtenidos correctamente', $clientes);
        break;

    case 'obtener':
        $id = intval($_GET['id'] ?? $data['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de cliente no válido.', null, 400);
        }

        $stmt = $pdo->prepare("SELECT id, usuario, tipo, nombre, correo, telefono, direccion, fecha
                               FROM usuarios WHERE id = :id AND tipo = 'cliente'");
        $stmt->execute([':id' => $id]);
        $cliente = $stmt->fetch();

        if (!$cliente) {
            jsonResponse('error', 'Cliente no encontrado.', null, 404);
        }

        $cliente['id'] = (int)$cliente['id'];
        jsonResponse('exito', 'Cliente encontrado', $cliente);
        break;

    case 'crear':
    case 'registrar':
        $nombre = trim($data['nombre'] ?? '');
        $usuario = trim($data['usuario'] ?? '');
        $correo = trim($data['correo'] ?? '');
        $telefono = trim($data['telefono'] ?? '');
        $direccion = trim($data['direccion'] ?? '');
        $contrasena = trim($data['contrasena'] ?? '');

        if (empty($nombre) || empty($usuario) || empty($correo) || empty($contrasena)) {
            jsonResponse('error', 'Nombre, usuario, correo y contraseña son obligatorios.', null, 400);
        }

        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE LOWER(usuario) = LOWER(:usuario) OR LOWER(correo) = LOWER(:correo)");
        $stmt->execute([':usuario' => $usuario, ':correo' => $correo]);
        if ($stmt->fetch()) {
            jsonResponse('error', 'El usuario o correo ya están registrados.', null, 400);
        }

        $stmt = $pdo->prepare("INSERT INTO usuarios (usuario, contrasena, tipo, nombre, correo, telefono, direccion, fecha)
                               VALUES (:usuario, :contrasena, 'cliente', :nombre, :correo, :telefono, :direccion, CURRENT_DATE)");
        $stmt->execute([
            ':usuario' => $usuario,
            ':contrasena' => $contrasena,
            ':nombre' => $nombre,
            ':correo' => $correo,
            ':telefono' => $telefono,
            ':direccion' => $direccion
        ]);

        $nuevoId = $pdo->lastInsertId();
        jsonResponse('exito', 'Cliente registrado correctamente', ['id' => (int)$nuevoId]);
        break;

    case 'editar':
        $id = intval($data['id'] ?? 0);
        $nombre = trim($data['nombre'] ?? '');
        $usuario = trim($data['usuario'] ?? '');
        $correo = trim($data['correo'] ?? '');
        $telefono = trim($data['telefono'] ?? '');
        $direccion = trim($data['direccion'] ?? '');

        if ($id <= 0 || empty($nombre) || empty($usuario) || empty($correo)) {
            jsonResponse('error', 'Faltan datos obligatorios para actualizar el cliente.', null, 400);
        }

        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE (LOWER(usuario) = LOWER(:usuario) OR LOWER(correo) = LOWER(:correo)) AND id != :id LIMIT 1");
        $stmt->execute([':usuario' => $usuario, ':correo' => $correo, ':id' => $id]);
        if ($stmt->fetch()) {
            jsonResponse('error', 'El usuario o correo ya existen para otro cliente.', null, 400);
        }

        $stmt = $pdo->prepare("UPDATE usuarios SET nombre = :nombre, usuario = :usuario, correo = :correo, telefono = :telefono, direccion = :direccion WHERE id = :id AND tipo = 'cliente'");
        $stmt->execute([
            ':nombre' => $nombre,
            ':usuario' => $usuario,
            ':correo' => $correo,
            ':telefono' => $telefono,
            ':direccion' => $direccion,
            ':id' => $id
        ]);

        jsonResponse('exito', 'Cliente actualizado correctamente');
        break;

    case 'eliminar':
        $id = intval($data['id'] ?? $_GET['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de cliente no válido.', null, 400);
        }

        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = :id AND tipo = 'cliente'");
        $stmt->execute([':id' => $id]);

        jsonResponse('exito', 'Cliente eliminado correctamente');
        break;

    default:
        jsonResponse('error', 'Acción no válida para clientes.', null, 400);
        break;
}
