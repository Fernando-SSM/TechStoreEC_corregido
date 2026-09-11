<?php
/**
 * API REST de Gestión de Compras de Stock a Proveedores
 * EquipoTechPAIT / TechStore EC
 */
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'listar';
$data = getRequestBody();
$pdo = getDBConnection();

switch ($action) {
    case 'listar':
        $provId = isset($_GET['proveedor_id']) ? intval($_GET['proveedor_id']) : 0;
        $sql = "SELECT c.*, p.nombre AS proveedor_nombre_db 
                FROM compras_stock c 
                LEFT JOIN proveedores p ON c.proveedor_id = p.id 
                WHERE 1=1";
        $params = [];

        if ($provId > 0) {
            $sql .= " AND c.proveedor_id = :provId";
            $params[':provId'] = $provId;
        }

        $sql .= " ORDER BY c.id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $compras = $stmt->fetchAll();

        foreach ($compras as &$c) {
            $c['id'] = (int)$c['id'];
            $c['proveedor_id'] = $c['proveedor_id'] ? (int)$c['proveedor_id'] : null;
            $c['total'] = (float)$c['total'];
        }

        jsonResponse('exito', 'Compras de stock obtenidas con éxito', $compras);
        break;

    case 'obtener':
        $id = intval($_GET['id'] ?? $data['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de compra no válido', null, 400);
        }

        $stmt = $pdo->prepare("SELECT * FROM compras_stock WHERE id = :id");
        $stmt->execute([':id' => $id]);
        $compra = $stmt->fetch();

        if ($compra) {
            $compra['id'] = (int)$compra['id'];
            $compra['total'] = (float)$compra['total'];
            jsonResponse('exito', 'Compra encontrada', $compra);
        } else {
            jsonResponse('error', 'Compra no encontrada', null, 404);
        }
        break;

    case 'crear':
        $proveedorId = intval($data['proveedor_id'] ?? 0);
        $proveedorNombre = trim($data['proveedor_nombre'] ?? '');
        $total = floatval($data['total'] ?? 0);
        $estado = trim($data['estado'] ?? 'Recibido');
        $detalle = trim($data['detalle'] ?? '');
        $productoId = intval($data['producto_id'] ?? 0);
        $cantidadIncremento = intval($data['cantidad'] ?? 0);

        if (empty($proveedorNombre) && $proveedorId <= 0) {
            jsonResponse('error', 'Debe especificar el proveedor.', null, 400);
        }

        if ($proveedorId > 0 && empty($proveedorNombre)) {
            $stmtProv = $pdo->prepare("SELECT nombre FROM proveedores WHERE id = :id");
            $stmtProv->execute([':id' => $proveedorId]);
            $provObj = $stmtProv->fetch();
            if ($provObj) {
                $proveedorNombre = $provObj['nombre'];
            }
        }

        try {
            $pdo->beginTransaction();

            $sql = "INSERT INTO compras_stock (proveedor_id, proveedor_nombre, fecha, total, estado, detalle) 
                    VALUES (:provId, :provNom, CURRENT_DATE, :total, :estado, :detalle)";
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':provId' => $proveedorId > 0 ? $proveedorId : null,
                ':provNom' => $proveedorNombre,
                ':total' => $total,
                ':estado' => $estado,
                ':detalle' => $detalle
            ]);

            $nuevoId = $pdo->lastInsertId();

            // Si se especificó un producto para incrementar su stock automáticamente
            if ($productoId > 0 && $cantidadIncremento > 0) {
                $stmtInc = $pdo->prepare("UPDATE productos SET stock = stock + :cant WHERE id = :pId");
                $stmtInc->execute([':cant' => $cantidadIncremento, ':pId' => $productoId]);
            }

            $pdo->commit();

            jsonResponse('exito', 'Compra de stock a proveedor registrada correctamente.', [
                'id' => (int)$nuevoId,
                'total' => $total,
                'stock_actualizado' => ($productoId > 0 && $cantidadIncremento > 0)
            ]);

        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            jsonResponse('error', 'Error al registrar la compra: ' . $e->getMessage(), null, 500);
        }
        break;

    case 'editar':
        $id = intval($data['id'] ?? 0);
        $proveedorNombre = trim($data['proveedor_nombre'] ?? '');
        $total = floatval($data['total'] ?? 0);
        $detalle = trim($data['detalle'] ?? '');

        if ($id <= 0 || empty($proveedorNombre) || $total < 0 || empty($detalle)) {
            jsonResponse('error', 'Datos incompletos para actualizar la compra.', null, 400);
        }

        $stmt = $pdo->prepare("UPDATE compras_stock SET proveedor_nombre = :proveedorNombre, total = :total, detalle = :detalle WHERE id = :id");
        $stmt->execute([
            ':id' => $id,
            ':proveedorNombre' => $proveedorNombre,
            ':total' => $total,
            ':detalle' => $detalle
        ]);
        jsonResponse('exito', 'Compra de stock actualizada correctamente.');
        break;

    case 'eliminar':
        $id = intval($data['id'] ?? $_GET['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de compra no válido.', null, 400);
        }
        $stmt = $pdo->prepare("DELETE FROM compras_stock WHERE id = :id");
        $stmt->execute([':id' => $id]);
        jsonResponse('exito', 'Compra de stock eliminada correctamente.');
        break;

    default:
        jsonResponse('error', 'Acción no válida en compras de stock.', null, 400);
        break;
}
?>
