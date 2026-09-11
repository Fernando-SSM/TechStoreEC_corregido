<?php
/**
 * API REST de Gestión de Perfil y Credenciales de Usuario
 * EquipoTechPAIT / TechStore EC
 */
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'obtener';
$data = getRequestBody();
$pdo = getDBConnection();

$usuarioId = intval($_SESSION['usuario_id'] ?? $data['usuario_id'] ?? $_GET['usuario_id'] ?? 0);

switch ($action) {
    case 'obtener':
        if ($usuarioId <= 0) {
            jsonResponse('error', 'Se requiere sesión o ID de usuario.', null, 401);
        }

        $stmt = $pdo->prepare("SELECT id, usuario, tipo, nombre, correo, telefono, direccion, fecha FROM usuarios WHERE id = :id");
        $stmt->execute([':id' => $usuarioId]);
        $user = $stmt->fetch();

        if ($user) {
            $user['id'] = (int)$user['id'];
            jsonResponse('exito', 'Perfil cargado con éxito', $user);
        } else {
            jsonResponse('error', 'Usuario no encontrado.', null, 404);
        }
        break;

    case 'actualizar':
        if ($usuarioId <= 0) {
            jsonResponse('error', 'Se requiere sesión activa.', null, 401);
        }

        $nombre = trim($data['nombre'] ?? '');
        $correo = trim($data['correo'] ?? '');
        $telefono = trim($data['telefono'] ?? '');
        $direccion = trim($data['direccion'] ?? '');

        if (empty($nombre) || empty($correo)) {
            jsonResponse('error', 'Nombre y correo electrónico son obligatorios.', null, 400);
        }

        // Verificar si el correo está ocupado por otro usuario
        $stmtCheck = $pdo->prepare("SELECT id FROM usuarios WHERE LOWER(correo) = LOWER(:correo) AND id != :id");
        $stmtCheck->execute([':correo' => $correo, ':id' => $usuarioId]);
        if ($stmtCheck->fetch()) {
            jsonResponse('error', 'El correo electrónico ya está registrado por otro usuario.', null, 400);
        }

        $sql = "UPDATE usuarios 
                SET nombre = :nombre, correo = :correo, telefono = :telefono, direccion = :direccion 
                WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $usuarioId,
            ':nombre' => $nombre,
            ':correo' => $correo,
            ':telefono' => $telefono,
            ':direccion' => $direccion
        ]);

        $_SESSION['nombre'] = $nombre;

        jsonResponse('exito', 'Perfil de usuario actualizado correctamente.', [
            'id' => $usuarioId,
            'nombre' => $nombre,
            'correo' => $correo,
            'telefono' => $telefono,
            'direccion' => $direccion
        ]);
        break;

    case 'cambiar_clave':
        if ($usuarioId <= 0) {
            jsonResponse('error', 'Se requiere sesión activa.', null, 401);
        }

        $claveActual = trim($data['clave_actual'] ?? '');
        $claveNueva = trim($data['clave_nueva'] ?? '');

        if (empty($claveActual) || empty($claveNueva)) {
            jsonResponse('error', 'Debe proporcionar la contraseña actual y la nueva contraseña.', null, 400);
        }

        if (strlen($claveNueva) < 4) {
            jsonResponse('error', 'La nueva contraseña debe tener al menos 4 caracteres.', null, 400);
        }

        // Obtener clave de la BD
        $stmtPass = $pdo->prepare("SELECT contrasena FROM usuarios WHERE id = :id");
        $stmtPass->execute([':id' => $usuarioId]);
        $uObj = $stmtPass->fetch();

        if (!$uObj) {
            jsonResponse('error', 'Usuario no encontrado.', null, 404);
        }

        // Verificar clave actual
        if ($uObj['contrasena'] !== $claveActual && !password_verify($claveActual, $uObj['contrasena'])) {
            jsonResponse('error', 'La contraseña actual ingresada es incorrecta.', null, 400);
        }

        $stmtUp = $pdo->prepare("UPDATE usuarios SET contrasena = :pass WHERE id = :id");
        $stmtUp->execute([':pass' => $claveNueva, ':id' => $usuarioId]);

        jsonResponse('exito', 'Contraseña actualizada con éxito.');
        break;

    default:
        jsonResponse('error', 'Acción no válida en perfil.', null, 400);
        break;
}
?>
