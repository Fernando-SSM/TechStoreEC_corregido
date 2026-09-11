<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Iniciar sesión PHP
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once __DIR__ . '/../config/db.php';

$data = getRequestBody();

// 3. Capturar $action incluso si viene en el JSON ($data)
$action = $_GET['action'] ?? $_POST['action'] ?? $data['action'] ?? '';
$pdo = getDBConnection();

switch ($action) {
    case 'listar':
        $stmt = $pdo->prepare("SELECT id, usuario, tipo, nombre, correo, telefono, direccion, fecha FROM usuarios ORDER BY id DESC");
        $stmt->execute();
        $usuarios = $stmt->fetchAll();
        foreach ($usuarios as &$usuario) {
            $usuario['id'] = (int)$usuario['id'];
        }
        jsonResponse('exito', 'Usuarios obtenidos correctamente', $usuarios);
        break;

    case 'login':
        $usuario = trim($data['usuario'] ?? '');
        $contrasena = trim($data['contrasena'] ?? '');

        if (empty($usuario) || empty($contrasena)) {
            jsonResponse('error', 'Por favor complete todos los campos de acceso.', null, 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM usuarios WHERE LOWER(usuario) = LOWER(:usuario) LIMIT 1");
        $stmt->execute([':usuario' => $usuario]);
        $user = $stmt->fetch();

        if ($user && ($user['contrasena'] === $contrasena || password_verify($contrasena, $user['contrasena']))) {
            $_SESSION['usuario_id'] = $user['id'];
            $_SESSION['usuario'] = $user['usuario'];
            $_SESSION['nombre'] = $user['nombre'];
            $_SESSION['tipo'] = $user['tipo'];

            unset($user['contrasena']); // No enviar la contraseña al cliente
            jsonResponse('exito', 'Inicio de sesión exitoso', $user);
        } else {
            jsonResponse('error', 'Credenciales incorrectas.', null, 401);
        }
        break;

    case 'registro':
        $nombre = trim($data['nombre'] ?? '');
        $usuario = trim($data['usuario'] ?? '');
        $correo = trim($data['correo'] ?? '');
        $telefono = trim($data['telefono'] ?? '');
        $contrasena = trim($data['contrasena'] ?? '');

        if (empty($nombre) || empty($usuario) || empty($correo) || empty($contrasena)) {
            jsonResponse('error', 'Nombre, usuario, correo y contraseña son obligatorios.', null, 400);
        }

        // Verificar existencia previa
        $stmt = $pdo->prepare("SELECT id FROM usuarios WHERE LOWER(usuario) = LOWER(:usuario) OR LOWER(correo) = LOWER(:correo)");
        $stmt->execute([':usuario' => $usuario, ':correo' => $correo]);
        if ($stmt->fetch()) {
            jsonResponse('error', 'El nombre de usuario o el correo ya se encuentran registrados.', null, 400);
        }

        $sql = "INSERT INTO usuarios (usuario, contrasena, tipo, nombre, correo, telefono, direccion, fecha) 
                VALUES (:usuario, :contrasena, 'cliente', :nombre, :correo, :telefono, 'Quito, Ecuador', CURRENT_DATE)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':usuario' => $usuario,
            ':contrasena' => $contrasena,
            ':nombre' => $nombre,
            ':correo' => $correo,
            ':telefono' => $telefono
        ]);

        $nuevoId = $pdo->lastInsertId();
        jsonResponse('exito', '¡Registro exitoso! Ya puedes iniciar sesión con tu cuenta.', ['id' => $nuevoId]);
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
            jsonResponse('error', 'El usuario o correo ya están registrados para otro cliente.', null, 400);
        }

        $sql = "UPDATE usuarios SET nombre = :nombre, usuario = :usuario, correo = :correo, telefono = :telefono, direccion = :direccion WHERE id = :id AND tipo = 'cliente'";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $id,
            ':nombre' => $nombre,
            ':usuario' => $usuario,
            ':correo' => $correo,
            ':telefono' => $telefono,
            ':direccion' => $direccion
        ]);

        jsonResponse('exito', 'Cliente actualizado correctamente.');
        break;

    case 'eliminar':
        $id = intval($data['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de cliente no válido.', null, 400);
        }

        $stmt = $pdo->prepare("DELETE FROM usuarios WHERE id = :id AND tipo = 'cliente'");
        $stmt->execute([':id' => $id]);

        jsonResponse('exito', 'Cliente eliminado correctamente.');
        break;

    case 'sesion':
        if (isset($_SESSION['usuario_id'])) {
            jsonResponse('exito', 'Sesión activa', [
                'id' => $_SESSION['usuario_id'],
                'usuario' => $_SESSION['usuario'],
                'nombre' => $_SESSION['nombre'],
                'tipo' => $_SESSION['tipo']
            ]);
        } else {
            jsonResponse('error', 'No hay sesión activa', null, 401);
        }
        break;

    case 'logout':
        session_unset();
        session_destroy();
        jsonResponse('exito', 'Sesión cerrada correctamente');
        break;

    default:
        jsonResponse('error', 'Acción no válida o no especificada. Acción recibida: ' . json_encode($action), null, 400);
        break;
}