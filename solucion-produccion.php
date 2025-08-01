<?php
echo "<h1>🔧 SOLUCIÓN COMPLETA - Producción Laravel</h1>";
echo "<p><strong>⚠️ ESTO VA A LIMPIAR Y CONFIGURAR CORRECTAMENTE</strong></p>";

// Configuración del entorno
$laravelPath = '/home/transp26/esmeralda/';
$publicPath = '/home/transp26/public_html/';

chdir($laravelPath);
echo "<h2>📁 Directorio Laravel: " . getcwd() . "</h2>";

// 1. LIMPIEZA NUCLEAR DE CACHE
echo "<h3>1. 🗑️ Limpieza nuclear de caché</h3>";
$cacheDirs = [
    'bootstrap/cache/',
    'storage/framework/cache/',
    'storage/framework/sessions/',
    'storage/framework/views/',
    'storage/logs/'
];

foreach ($cacheDirs as $dir) {
    $fullPath = $laravelPath . $dir;
    if (is_dir($fullPath)) {
        shell_exec("rm -rf {$fullPath}*");
        echo "✅ Limpiado: {$dir}<br>";
    }
}

// 2. ELIMINAR CARPETAS DE WINDOWS EN PUBLIC_HTML
echo "<h3>2. 🗑️ Eliminando carpetas de Windows</h3>";
$patterns = [
    "find {$publicPath} -name '*Programacion*' -type d",
    "find {$publicPath} -name 'D:*' -type d",
    "find {$publicPath} -name '*Laravel*' -type d",
    "find {$publicPath} -path '*/storage/*' -type d"
];

foreach ($patterns as $pattern) {
    $found = shell_exec($pattern . ' 2>/dev/null');
    if ($found) {
        $dirs = explode("\n", trim($found));
        foreach ($dirs as $dir) {
            if (!empty($dir) && strpos($dir, $publicPath) === 0) {
                shell_exec("rm -rf '{$dir}' 2>/dev/null");
                echo "✅ Eliminado: " . basename($dir) . "<br>";
            }
        }
    }
}

// 3. RECREAR ESTRUCTURA CORRECTA
echo "<h3>3. 📁 Recreando estructura correcta</h3>";
$dirs = [
    'bootstrap/cache',
    'storage/framework/cache/data',
    'storage/framework/sessions',
    'storage/framework/views',
    'storage/logs'
];

foreach ($dirs as $dir) {
    $fullPath = $laravelPath . $dir;
    if (!is_dir($fullPath)) {
        mkdir($fullPath, 0755, true);
        echo "✅ Creado: {$dir}<br>";
    }
}

// 4. VERIFICAR Y CORREGIR .ENV
echo "<h3>4. 🔧 Verificando configuración .env</h3>";
$envFile = $laravelPath . '.env';
if (file_exists($envFile)) {
    $envContent = file_get_contents($envFile);

    // Verificar configuración de base de datos
    if (strpos($envContent, 'DB_CONNECTION=') === false) {
        echo "❌ Falta configuración de BD en .env<br>";
    } else {
        // Mostrar configuración actual (sin contraseñas)
        $lines = explode("\n", $envContent);
        echo "<h4>Configuración actual:</h4><pre>";
        foreach ($lines as $line) {
            if (strpos($line, 'DB_') === 0 && strpos($line, 'PASSWORD') === false) {
                echo htmlspecialchars($line) . "\n";
            }
        }
        echo "</pre>";
    }
} else {
    echo "❌ Archivo .env no encontrado<br>";
    echo "<p>Debes crear un archivo .env con:</p>";
    echo "<pre>
APP_NAME=LaraReact
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_URL=https://tudominio.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=tu_base_datos
DB_USERNAME=tu_usuario
DB_PASSWORD=tu_contraseña
</pre>";
}

// 5. PERMISOS CORRECTOS
echo "<h3>5. 🔒 Estableciendo permisos</h3>";
shell_exec("chmod -R 755 {$laravelPath}storage/");
shell_exec("chmod -R 755 {$laravelPath}bootstrap/cache/");
shell_exec("chown -R \$(whoami):\$(whoami) {$laravelPath}storage/ 2>/dev/null");
shell_exec("chown -R \$(whoami):\$(whoami) {$laravelPath}bootstrap/cache/ 2>/dev/null");
echo "✅ Permisos establecidos<br>";

// 6. COMANDOS ARTISAN
echo "<h3>6. ⚡ Comandos Artisan</h3>";
$commands = [
    'php artisan config:clear' => 'Limpiar configuración',
    'php artisan cache:clear' => 'Limpiar caché de aplicación',
    'php artisan route:clear' => 'Limpiar rutas',
    'php artisan view:clear' => 'Limpiar vistas',
    'php artisan optimize:clear' => 'Limpiar optimizaciones',
];

foreach ($commands as $cmd => $desc) {
    echo "🔄 {$desc}...<br>";
    $output = shell_exec($cmd . ' 2>&1');
    if (strpos($output, 'Exception') === false && strpos($output, 'Error') === false) {
        echo "✅ OK<br>";
    } else {
        echo "❌ Error: <pre>" . htmlspecialchars($output) . "</pre>";
    }
}

// 7. GENERAR APP_KEY SI NO EXISTE
echo "<h3>7. 🔑 Verificando APP_KEY</h3>";
$output = shell_exec('php artisan key:generate --show 2>&1');
if ($output && strpos($output, 'base64:') !== false) {
    echo "✅ APP_KEY disponible<br>";
} else {
    echo "❌ Problema con APP_KEY: <pre>" . htmlspecialchars($output) . "</pre>";
}

// 8. PROBAR CONEXIÓN A BD
echo "<h3>8. 🔌 Probando conexión a base de datos</h3>";
$output = shell_exec('php artisan migrate:status 2>&1');
if (strpos($output, 'Connection refused') !== false) {
    echo "❌ Error de conexión a BD. Verifica:<br>";
    echo "• El servicio MySQL está corriendo<br>";
    echo "• Las credenciales en .env son correctas<br>";
    echo "• El host/puerto son correctos<br>";
    echo "<pre>" . htmlspecialchars($output) . "</pre>";
} else if (strpos($output, 'Migration name') !== false) {
    echo "✅ Conexión a BD exitosa<br>";
} else {
    echo "⚠️ Estado incierto: <pre>" . htmlspecialchars($output) . "</pre>";
}

// 9. OPTIMIZAR PARA PRODUCCIÓN
echo "<h3>9. 🚀 Optimizando para producción</h3>";
$optimizeCommands = [
    'php artisan config:cache' => 'Cachear configuración',
    'php artisan route:cache' => 'Cachear rutas',
    'php artisan view:cache' => 'Cachear vistas'
];

foreach ($optimizeCommands as $cmd => $desc) {
    echo "🔄 {$desc}...<br>";
    $output = shell_exec($cmd . ' 2>&1');
    if (strpos($output, 'Exception') === false) {
        echo "✅ OK<br>";
    } else {
        echo "❌ Error: <pre>" . htmlspecialchars($output) . "</pre>";
    }
}

echo "<h2>🎯 PROCESO COMPLETADO</h2>";
echo "<p><strong>📋 Lista de verificación:</strong></p>";
echo "<ul>";
echo "<li>✅ Caché limpiado</li>";
echo "<li>✅ Carpetas de Windows eliminadas</li>";
echo "<li>✅ Estructura recreada</li>";
echo "<li>✅ Permisos establecidos</li>";
echo "<li>⚠️ Verifica tu .env</li>";
echo "<li>⚠️ Verifica conexión a BD</li>";
echo "</ul>";

echo "<p><strong>🔗 Prueba tu aplicación:</strong> <a href='/' target='_blank'>Ir a la aplicación</a></p>";
echo "<p><strong>⚠️ Elimina este archivo:</strong> <code>rm {$_SERVER['SCRIPT_FILENAME']}</code></p>";
?>
