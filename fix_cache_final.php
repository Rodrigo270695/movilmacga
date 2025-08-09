<?php
/**
 * SCRIPT FINAL PARA LIMPIAR CACHÉ DE PERMISOS
 * Sube este archivo a la raíz de tu proyecto y ejecuta desde el navegador
 */

echo "<h1>🧹 Limpiando caché final...</h1><pre>";

$commands = [
    'php artisan permission:cache-reset',
    'php artisan cache:clear',
    'php artisan config:clear',
    'php artisan route:clear'
];

foreach ($commands as $command) {
    echo "\n🔄 Ejecutando: $command\n";
    $output = [];
    $return = 0;
    exec("cd " . __DIR__ . " && $command 2>&1", $output, $return);

    if ($return === 0) {
        echo "✅ Éxito\n";
        foreach ($output as $line) {
            echo "   $line\n";
        }
    } else {
        echo "❌ Error\n";
        foreach ($output as $line) {
            echo "   $line\n";
        }
    }
}

echo "\n🎉 ¡Listo! Ahora cierra sesión, vuelve a iniciar sesión y prueba los módulos.\n";
echo "\n⚠️ ELIMINA este archivo por seguridad.\n";
echo "</pre>";
?>
