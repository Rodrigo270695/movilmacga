<?php
/**
 * SCRIPT RÁPIDO PARA LIMPIAR SOLO EL CACHÉ DE PERMISOS
 */

echo "<h1>🔄 Limpieza rápida de caché...</h1>";
echo "<pre>";

try {
    // Solo limpiar caché de permisos (más rápido)
    echo "🔐 Limpiando caché de permisos...\n";

    // Método directo sin artisan
    if (function_exists('opcache_reset')) {
        opcache_reset();
        echo "✅ OPCache reseteado\n";
    }

    // Limpiar archivos de caché manualmente
    $cacheDir = __DIR__ . '/bootstrap/cache/';
    if (is_dir($cacheDir)) {
        $files = glob($cacheDir . '*.php');
        foreach ($files as $file) {
            if (strpos($file, 'spatie.permission') !== false) {
                unlink($file);
                echo "✅ Archivo de caché eliminado: " . basename($file) . "\n";
            }
        }
    }

    echo "\n🎉 ¡Caché limpiado!\n";
    echo "📱 Ahora cierra sesión, vuelve a iniciar sesión y prueba.\n";
    echo "\n⚠️ ELIMINA este archivo por seguridad.\n";

} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "\n💡 Prueba cerrando sesión y volviendo a iniciar sesión.\n";
}

echo "</pre>";
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
pre { background: #2d3748; color: #e2e8f0; padding: 20px; border-radius: 5px; }
h1 { color: #2d3748; }
</style>
