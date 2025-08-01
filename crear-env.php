<?php
echo "<h1>🔑 CREAR ARCHIVO .ENV - Laravel</h1>";

$laravelPath = '/home/grupoma1/public_html/movilmacga.grupomaclabi.com/';
$envPath = $laravelPath . '.env';

echo "<h2>📁 Directorio: {$laravelPath}</h2>";

// Verificar si existe .env
if (file_exists($envPath)) {
    echo "<h3>⚠️ YA EXISTE .env</h3>";
    echo "<p>Archivo encontrado. ¿Quieres ver su contenido?</p>";
    $content = file_get_contents($envPath);
    echo "<pre>" . htmlspecialchars($content) . "</pre>";
} else {
    echo "<h3>📝 Creando archivo .env</h3>";

    // Generar APP_KEY
    chdir($laravelPath);
    $appKey = shell_exec('php artisan key:generate --show 2>&1');
    if (!$appKey || strpos($appKey, 'base64:') === false) {
        $appKey = 'base64:' . base64_encode(random_bytes(32));
    }
    $appKey = trim($appKey);

    $envContent = "APP_NAME=LaraReact
APP_ENV=production
APP_KEY={$appKey}
APP_DEBUG=false
APP_URL=https://movilmacga.grupomaclabi.com

LOG_CHANNEL=stack
LOG_DEPRECATIONS_CHANNEL=null
LOG_LEVEL=debug

# Base de datos - AJUSTA ESTOS VALORES según tu hosting
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=grupoma1_movilmacga
DB_USERNAME=grupoma1_user
DB_PASSWORD=tu_contraseña_aqui

BROADCAST_DRIVER=log
CACHE_DRIVER=file
FILESYSTEM_DISK=local
QUEUE_CONNECTION=sync
SESSION_DRIVER=database
SESSION_LIFETIME=120

MEMCACHED_HOST=127.0.0.1

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailpit
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=\"hello@example.com\"
MAIL_FROM_NAME=\"\${APP_NAME}\"

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=us-east-1
AWS_BUCKET=
AWS_USE_PATH_STYLE_ENDPOINT=false

PUSHER_APP_ID=
PUSHER_APP_KEY=
PUSHER_APP_SECRET=
PUSHER_HOST=
PUSHER_PORT=443
PUSHER_SCHEME=https
PUSHER_APP_CLUSTER=mt1

VITE_APP_NAME=\"\${APP_NAME}\"
VITE_PUSHER_APP_KEY=\"\${PUSHER_APP_KEY}\"
VITE_PUSHER_HOST=\"\${PUSHER_HOST}\"
VITE_PUSHER_PORT=\"\${PUSHER_PORT}\"
VITE_PUSHER_SCHEME=\"\${PUSHER_SCHEME}\"
VITE_PUSHER_APP_CLUSTER=\"\${PUSHER_APP_CLUSTER}\"";

    // Escribir archivo .env
    if (file_put_contents($envPath, $envContent)) {
        echo "✅ Archivo .env creado exitosamente<br>";
        echo "<h4>Contenido creado:</h4>";
        echo "<pre>" . htmlspecialchars($envContent) . "</pre>";

        // Establecer permisos correctos
        chmod($envPath, 0644);
        echo "✅ Permisos establecidos (644)<br>";

    } else {
        echo "❌ Error al crear el archivo .env<br>";
        echo "Verifica permisos de escritura en: {$laravelPath}<br>";
    }
}

echo "<h3>🔧 Información importante:</h3>";
echo "<p><strong>Debes editar manualmente las siguientes líneas en el .env:</strong></p>";
echo "<ul>";
echo "<li><code>DB_DATABASE=</code> → Nombre de tu base de datos</li>";
echo "<li><code>DB_USERNAME=</code> → Usuario de tu base de datos</li>";
echo "<li><code>DB_PASSWORD=</code> → Contraseña de tu base de datos</li>";
echo "<li><code>APP_URL=</code> → URL correcta de tu dominio</li>";
echo "</ul>";

echo "<h3>📋 Datos típicos de cPanel/Hosting:</h3>";
echo "<ul>";
echo "<li><strong>DB_HOST:</strong> localhost (generalmente)</li>";
echo "<li><strong>DB_PORT:</strong> 3306 (generalmente)</li>";
echo "<li><strong>DB_DATABASE:</strong> usuario_nombrebd (ej: grupoma1_movilmacga)</li>";
echo "<li><strong>DB_USERNAME:</strong> usuario_nombreuser (ej: grupoma1_user)</li>";
echo "</ul>";

// Probar configuración si existe .env
if (file_exists($envPath)) {
    echo "<h3>🧪 Probando configuración</h3>";

    chdir($laravelPath);

    // Probar comandos básicos
    echo "🔄 Probando php artisan config:clear...<br>";
    $output = shell_exec('php artisan config:clear 2>&1');
    if (strpos($output, 'Configuration cache cleared') !== false || empty($output)) {
        echo "✅ config:clear OK<br>";
    } else {
        echo "❌ Error en config:clear: <pre>" . htmlspecialchars($output) . "</pre>";
    }

    echo "🔄 Probando php artisan about...<br>";
    $output = shell_exec('php artisan about 2>&1');
    if (strpos($output, 'Environment') !== false) {
        echo "✅ Laravel funcionando correctamente<br>";
    } else {
        echo "❌ Problema con Laravel: <pre>" . htmlspecialchars(substr($output, 0, 500)) . "</pre>";
    }
}

echo "<h2>🎯 PRÓXIMOS PASOS:</h2>";
echo "<ol>";
echo "<li>✅ Archivo .env creado</li>";
echo "<li>🔧 <strong>EDITA el .env</strong> con los datos correctos de BD</li>";
echo "<li>🚀 Ejecuta el script de optimización nuevamente</li>";
echo "<li>🧪 Prueba tu aplicación</li>";
echo "</ol>";

echo "<p><strong>⚠️ Para editar .env:</strong></p>";
echo "<p>Usa el administrador de archivos de cPanel o FTP para editar: <code>{$envPath}</code></p>";

echo "<p><strong>🗑️ Elimina este archivo:</strong> <code>rm " . $_SERVER['SCRIPT_FILENAME'] . "</code></p>";
?>
