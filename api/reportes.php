<?php
/**
 * API REST de Reportes, Analítica y KPIs
 * EquipoTechPAIT / TechStore EC
 */
require_once __DIR__ . '/../config/db.php';

$action = $_GET['action'] ?? $_POST['action'] ?? 'resumen';
$data = getRequestBody();
$pdo = getDBConnection();

switch ($action) {
    case 'resumen':
    case 'kpis':
        // 1. Total Productos y Stock Global
        $stmtProd = $pdo->query("SELECT COUNT(*) AS total_productos, SUM(stock) AS stock_total FROM productos");
        $resProd = $stmtProd->fetch();

        // 2. Total Clientes Registrados
        $stmtCli = $pdo->query("SELECT COUNT(*) AS total_clientes FROM usuarios WHERE tipo = 'cliente'");
        $resCli = $stmtCli->fetch();

        // 3. Métricas de Ventas
        $stmtVentas = $pdo->query("SELECT COUNT(*) AS total_ordenes, COALESCE(SUM(total), 0) AS ingresos_totales FROM ventas");
        $resVentas = $stmtVentas->fetch();

        // 4. Total de egresos por compras de stock
        $stmtCompras = $pdo->query("SELECT COALESCE(SUM(total), 0) AS egresos_totales FROM compras_stock");
        $resCompras = $stmtCompras->fetch();

        // 5. Productos con Stock Crítico (<= 5 unidades)
        $stmtBajoStock = $pdo->query("SELECT p.id, p.nombre, p.stock, c.nombre AS categoria 
                                     FROM productos p 
                                     LEFT JOIN categorias c ON p.categoria_id = c.id 
                                     WHERE p.stock <= 5 
                                     ORDER BY p.stock ASC");
        $listBajoStock = $stmtBajoStock->fetchAll();

        // 6. Productos Más Vendidos (Top 5)
        $stmtTop = $pdo->query("SELECT dv.nombre_producto, SUM(dv.cantidad) AS unidades_vendidas, SUM(dv.cantidad * dv.precio_unitario) AS total_generado 
                                FROM detalle_ventas dv 
                                GROUP BY dv.producto_id, dv.nombre_producto 
                                ORDER BY unidades_vendidas DESC 
                                LIMIT 5");
        $topProductos = $stmtTop->fetchAll();

        // 7. Ventas por Categoría
        $stmtCat = $pdo->query("SELECT c.nombre AS categoria, COUNT(dv.id) AS cantidad_items, COALESCE(SUM(dv.cantidad * dv.precio_unitario), 0) AS total_ventas 
                                FROM categorias c 
                                LEFT JOIN productos p ON c.id = p.categoria_id 
                                LEFT JOIN detalle_ventas dv ON p.id = dv.producto_id 
                                GROUP BY c.id 
                                ORDER BY total_ventas DESC");
        $ventasPorCategoria = $stmtCat->fetchAll();

        jsonResponse('exito', 'Métricas y reportes consolidados con éxito', [
            'kpis' => [
                'total_productos' => (int)($resProd['total_productos'] ?? 0),
                'stock_total' => (int)($resProd['stock_total'] ?? 0),
                'total_clientes' => (int)($resCli['total_clientes'] ?? 0),
                'total_ordenes' => (int)($resVentas['total_ordenes'] ?? 0),
                'ingresos_totales' => (float)($resVentas['ingresos_totales'] ?? 0.0),
                'egresos_totales' => (float)($resCompras['egresos_totales'] ?? 0.0),
                'ganancia_neta' => (float)($resVentas['ingresos_totales'] ?? 0.0) - (float)($resCompras['egresos_totales'] ?? 0.0),
                'productos_stock_critico' => count($listBajoStock)
            ],
            'productos_stock_critico' => $listBajoStock,
            'top_productos_vendidos' => $topProductos,
            'ventas_por_categoria' => $ventasPorCategoria
        ]);
        break;

    default:
        jsonResponse('error', 'Acción no válida en reportes.', null, 400);
        break;
}
?>
