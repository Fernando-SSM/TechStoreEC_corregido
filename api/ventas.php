<?php
/**
 * API REST de Gestión de Ventas y Órdenes
 * EquipoTechPAIT / TechStore EC
 */
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'listar';
$data = getRequestBody();
$pdo = getDBConnection();

switch ($action) {
    case 'listar':
        $clienteId = isset($_GET['cliente_id']) ? intval($_GET['cliente_id']) : 0;
        $estado = isset($_GET['estado']) ? trim($_GET['estado']) : '';

        try {
            $stmtCheck = $pdo->query("SHOW COLUMNS FROM ventas LIKE 'factura_datos'");
            if ($stmtCheck->rowCount() === 0) {
                $pdo->exec("ALTER TABLE ventas ADD COLUMN factura_datos JSON NULL AFTER metodo_pago");
                $pdo->exec("ALTER TABLE ventas ADD COLUMN factura_requerida TINYINT(1) NOT NULL DEFAULT 0 AFTER factura_datos");
            }
            $stmtCheckP = $pdo->query("SHOW COLUMNS FROM ventas LIKE 'datos_pago'");
            if ($stmtCheckP->rowCount() === 0) {
                $pdo->exec("ALTER TABLE ventas ADD COLUMN datos_pago JSON NULL AFTER factura_datos");
            }
        } catch (Exception $e) {
            // ignora migración si ya existe
        }

        $sql = "SELECT v.*, u.nombre AS cliente_nombre, u.correo AS cliente_correo 
                FROM ventas v 
                LEFT JOIN usuarios u ON v.cliente_id = u.id 
                WHERE 1=1";
        $params = [];

        if ($clienteId > 0) {
            $sql .= " AND v.cliente_id = :clienteId";
            $params[':clienteId'] = $clienteId;
        }

        if (!empty($estado)) {
            $sql .= " AND v.estado = :estado";
            $params[':estado'] = $estado;
        }

        $sql .= " ORDER BY v.id DESC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $ventas = $stmt->fetchAll();

        foreach ($ventas as &$v) {
            $v['id'] = (int)$v['id'];
            $v['cliente_id'] = (int)$v['cliente_id'];
            $v['total'] = (float)$v['total'];
            $v['factura_requerida'] = (int)($v['factura_requerida'] ?? 0);
            $v['factura_datos'] = !empty($v['factura_datos']) ? json_decode($v['factura_datos'], true) : null;
            $v['datos_pago'] = !empty($v['datos_pago']) ? json_decode($v['datos_pago'], true) : null;

            $stmtDet = $pdo->prepare("SELECT dv.*, p.imagen FROM detalle_ventas dv LEFT JOIN productos p ON dv.producto_id = p.id WHERE dv.venta_id = :ventaId");
            $stmtDet->execute([':ventaId' => $v['id']]);
            $items = $stmtDet->fetchAll();

            foreach ($items as &$item) {
                $item['id'] = (int)$item['id'];
                $item['venta_id'] = (int)$item['venta_id'];
                $item['producto_id'] = (int)$item['producto_id'];
                $item['cantidad'] = (int)$item['cantidad'];
                $item['precio_unitario'] = (float)$item['precio_unitario'];
            }
            $v['productos'] = $items;
        }

        jsonResponse('exito', 'Ventas obtenidas con éxito', $ventas);
        break;

    case 'obtener':
        $id = intval($_GET['id'] ?? $data['id'] ?? 0);
        if ($id <= 0) {
            jsonResponse('error', 'ID de venta no válido', null, 400);
        }

        $stmt = $pdo->prepare("SELECT v.*, u.nombre AS cliente_nombre, u.correo AS cliente_correo, u.telefono AS cliente_telefono FROM ventas v LEFT JOIN usuarios u ON v.cliente_id = u.id WHERE v.id = :id");
        $stmt->execute([':id' => $id]);
        $venta = $stmt->fetch();

        if ($venta) {
            $venta['id'] = (int)$venta['id'];
            $venta['cliente_id'] = (int)$venta['cliente_id'];
            $venta['total'] = (float)$venta['total'];
            $venta['factura_requerida'] = (int)($venta['factura_requerida'] ?? 0);
            $venta['factura_datos'] = !empty($venta['factura_datos']) ? json_decode($venta['factura_datos'], true) : null;
            $venta['datos_pago'] = !empty($venta['datos_pago']) ? json_decode($venta['datos_pago'], true) : null;

            $stmtDet = $pdo->prepare("SELECT dv.*, p.imagen FROM detalle_ventas dv LEFT JOIN productos p ON dv.producto_id = p.id WHERE dv.venta_id = :ventaId");
            $stmtDet->execute([':ventaId' => $venta['id']]);
            $items = $stmtDet->fetchAll();

            foreach ($items as &$item) {
                $item['id'] = (int)$item['id'];
                $item['venta_id'] = (int)$item['venta_id'];
                $item['producto_id'] = (int)$item['producto_id'];
                $item['cantidad'] = (int)$item['cantidad'];
                $item['precio_unitario'] = (float)$item['precio_unitario'];
            }
            $venta['productos'] = $items;

            jsonResponse('exito', 'Detalle de venta encontrado', $venta);
        } else {
            jsonResponse('error', 'Venta no encontrada', null, 404);
        }
        break;

    case 'crear':
        try {
            $stmtCheck = $pdo->query("SHOW COLUMNS FROM ventas LIKE 'factura_datos'");
            if ($stmtCheck->rowCount() === 0) {
                $pdo->exec("ALTER TABLE ventas ADD COLUMN factura_datos JSON NULL AFTER metodo_pago");
                $pdo->exec("ALTER TABLE ventas ADD COLUMN factura_requerida TINYINT(1) NOT NULL DEFAULT 0 AFTER factura_datos");
            }
            $stmtCheckP = $pdo->query("SHOW COLUMNS FROM ventas LIKE 'datos_pago'");
            if ($stmtCheckP->rowCount() === 0) {
                $pdo->exec("ALTER TABLE ventas ADD COLUMN datos_pago JSON NULL AFTER factura_datos");
            }
        } catch (Exception $e) {
            // ignora migración si ya existe
        }

        $clienteId = intval($data['cliente_id'] ?? $_SESSION['usuario_id'] ?? 0);
        $clienteNombre = trim($data['cliente_nombre'] ?? $_SESSION['nombre'] ?? '');
        $metodoPago = trim($data['metodo_pago'] ?? 'Transferencia Bancaria');
        $requiereFactura = !empty($data['requiere_factura']) || (!empty($data['factura']) && is_array($data['factura']));
        $factura = is_array($data['factura'] ?? null) ? $data['factura'] : null;
        $datosPago = is_array($data['datos_pago'] ?? null) ? $data['datos_pago'] : null;
        $items = $data['productos'] ?? $data['carrito'] ?? [];

        if ($clienteId <= 0) {
            jsonResponse('error', 'Se requiere la sesión de un cliente válido para realizar la compra.', null, 401);
        }

        if (empty($items) || !is_array($items)) {
            jsonResponse('error', 'El carrito de compras no contiene productos.', null, 400);
        }

        try {
            $pdo->beginTransaction();

            $totalVenta = 0.0;

            foreach ($items as $item) {
                $pId = intval($item['id'] ?? $item['producto_id'] ?? 0);
                $cant = intval($item['cantidad'] ?? 1);

                if ($pId <= 0 || $cant <= 0) {
                    throw new Exception('Datos de producto no válidos en la solicitud.');
                }

                $stmtP = $pdo->prepare("SELECT nombre, precio, stock FROM productos WHERE id = :id FOR UPDATE");
                $stmtP->execute([':id' => $pId]);
                $prodBD = $stmtP->fetch();

                if (!$prodBD) {
                    throw new Exception("El producto ID $pId no fue encontrado.");
                }

                if ($prodBD['stock'] < $cant) {
                    throw new Exception("Stock insuficiente para el producto '{$prodBD['nombre']}'. Disponible: {$prodBD['stock']}.");
                }

                $totalVenta += ((float)$prodBD['precio'] * $cant);
            }

            $facturaJson = $factura ? json_encode($factura, JSON_UNESCAPED_UNICODE) : null;
            $datosPagoJson = $datosPago ? json_encode($datosPago, JSON_UNESCAPED_UNICODE) : null;
            $sqlVenta = "INSERT INTO ventas (cliente_id, cliente_nombre, fecha, total, estado, metodo_pago, factura_requerida, factura_datos, datos_pago) 
                         VALUES (:clienteId, :clienteNombre, NOW(), :total, 'Pendiente', :metodoPago, :facturaRequerida, :facturaDatos, :datosPago)";
            $stmtV = $pdo->prepare($sqlVenta);
            $stmtV->execute([
                ':clienteId' => $clienteId,
                ':clienteNombre' => $clienteNombre,
                ':total' => $totalVenta,
                ':metodoPago' => $metodoPago,
                ':facturaRequerida' => $requiereFactura ? 1 : 0,
                ':facturaDatos' => $facturaJson,
                ':datosPago' => $datosPagoJson
            ]);
            $ventaId = $pdo->lastInsertId();

            foreach ($items as $item) {
                $pId = intval($item['id'] ?? $item['producto_id'] ?? 0);
                $cant = intval($item['cantidad'] ?? 1);

                $stmtP = $pdo->prepare("SELECT nombre, precio FROM productos WHERE id = :id");
                $stmtP->execute([':id' => $pId]);
                $prodBD = $stmtP->fetch();

                $sqlDet = "INSERT INTO detalle_ventas (venta_id, producto_id, nombre_producto, cantidad, precio_unitario) 
                           VALUES (:ventaId, :pId, :nombre, :cant, :precio)";
                $stmtD = $pdo->prepare($sqlDet);
                $stmtD->execute([
                    ':ventaId' => $ventaId,
                    ':pId' => $pId,
                    ':nombre' => $prodBD['nombre'],
                    ':cant' => $cant,
                    ':precio' => $prodBD['precio']
                ]);

                $sqlStock = "UPDATE productos SET stock = stock - :cant WHERE id = :pId";
                $stmtS = $pdo->prepare($sqlStock);
                $stmtS->execute([':cant' => $cant, ':pId' => $pId]);
            }

            $pdo->commit();

            jsonResponse('exito', '¡Compra realizada con éxito! Su orden fue procesada.', [
                'id' => (int)$ventaId,
                'total' => $totalVenta,
                'estado' => 'Pendiente'
            ]);
        } catch (Exception $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            jsonResponse('error', 'Error al procesar la compra: ' . $e->getMessage(), null, 400);
        }
        break;

    case 'actualizar':
    case 'cambiar_estado':
        $id = intval($data['id'] ?? 0);
        $nuevoEstado = trim($data['estado'] ?? '');

        $estadosValidos = ['Pendiente', 'Enviado', 'Entregado'];
        if ($id <= 0 || !in_array($nuevoEstado, $estadosValidos)) {
            jsonResponse('error', 'ID de venta o estado no válido. (Estados válidos: Pendiente, Enviado, Entregado).', null, 400);
        }

        $stmt = $pdo->prepare("UPDATE ventas SET estado = :estado WHERE id = :id");
        $stmt->execute([':estado' => $nuevoEstado, ':id' => $id]);

        jsonResponse('exito', "Estado de la orden #$id actualizado a '$nuevoEstado'.");
        break;

    default:
        jsonResponse('error', 'Acción no válida en ventas.', null, 400);
        break;
}
