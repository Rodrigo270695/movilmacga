<?php
echo "<h1>🔌 VERIFICAR CONEXIÓN BASE DE DATOS</h1>";

$laravelPath = '/home/grupoma1/public_html/movilmacga.grupomaclabi.com/';
chdir($laravelPath);

echo "<h2>📁 Directorio: " . getcwd() . "</h2>";

// Verificar .env
echo "<h3>1. ✅ Verificando .env</h3>";
if (file_exists('.env')) {
    echo "✅ Archivo .env encontrado<br>";

    // Mostrar configuración de BD (sin contraseña)
    $envContent = file_get_contents('.env');
    $lines = explode("\n", $envContent);
    echo "<h4>Configuración de BD:</h4><pre>";
    foreach ($lines as $line) {
        if (strpos($line, 'DB_') === 0 && strpos($line, 'PASSWORD') === false) {
            echo htmlspecialchars($line) . "\n";
        } else if (strpos($line, 'DB_PASSWORD') === 0) {
            echo "DB_PASSWORD=*** (oculta)\n";
        }
    }
    echo "</pre>";
} else {
    echo "❌ Archivo .env NO encontrado<br>";
    exit;
}

// Probar conexión básica
echo "<h3>2. 🔌 Probando conexión a MySQL</h3>";

// Intentar conexión directa con PDO
try {
    $host = '127.0.0.1';
    $dbname = 'grupoma1_movilmacga';
    $username = 'grupoma1_movilmacga';
    $password = '*Rodrigo95*';

    echo "🔄 Intentando conexión directa...<br>";
    $pdo = new PDO("mysql:host={$host};port=3306;dbname={$dbname}", $username, $password);
    echo "✅ Conexión PDO exitosa<br>";

    // Probar una consulta simple
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    echo "✅ Consulta de prueba exitosa<br>";

} catch (PDOException $e) {
    echo "❌ Error de conexión PDO: " . $e->getMessage() . "<br>";

    // Intentar con localhost
    echo "🔄 Intentando con localhost...<br>";
    try {
        $pdo = new PDO("mysql:host=localhost;port=3306;dbname={$dbname}", $username, $password);
        echo "✅ Conexión con localhost exitosa<br>";
        echo "💡 <strong>Cambia DB_HOST=localhost en tu .env</strong><br>";
    } catch (PDOException $e2) {
        echo "❌ Error también con localhost: " . $e2->getMessage() . "<br>";
    }
}

// Probar con Artisan
echo "<h3>3. ⚡ Probando con Artisan</h3>";

$commands = [
    'php artisan config:clear' => 'Limpiar configuración',
    'php artisan migrate:status' => 'Estado de migraciones',
    'php artisan about' => 'Información de Laravel'
];

foreach ($commands as $cmd => $desc) {
    echo "🔄 {$desc}...<br>";
    $output = shell_exec($cmd . ' 2>&1');

    if (strpos($output, 'Connection refused') !== false) {
        echo "❌ Error de conexión: <pre>" . htmlspecialchars(substr($output, 0, 300)) . "</pre>";
    } else if (strpos($output, 'Exception') !== false || strpos($output, 'Error') !== false) {
        echo "⚠️ Advertencia: <pre>" . htmlspecialchars(substr($output, 0, 300)) . "</pre>";
    } else {
        echo "✅ OK<br>";
        if ($cmd === 'php artisan about') {
            echo "<details><summary>Ver detalles</summary><pre>" . htmlspecialchars(substr($output, 0, 800)) . "</pre></details>";
        }
    }
}

// Verificar tablas necesarias
echo "<h3>4. 📋 Verificando tablas necesarias</h3>";

if (isset($pdo)) {
    $requiredTables = ['users', 'sessions', 'cache', 'jobs'];

    foreach ($requiredTables as $table) {
        try {
            $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
            if ($stmt->rowCount() > 0) {
                echo "✅ Tabla '{$table}' existe<br>";
            } else {
                echo "❌ Tabla '{$table}' NO existe<br>";
                if ($table === 'sessions') {
                    echo "💡 Ejecuta: <code>php artisan session:table && php artisan migrate</code><br>";
                }
            }
        } catch (Exception $e) {
            echo "❌ Error verificando tabla '{$table}': " . $e->getMessage() . "<br>";
        }
    }
}

echo "<h2>🎯 RESUMEN</h2>";
echo "<p>Si ves ✅ en conexión PDO pero ❌ en Artisan, el problema puede ser:</p>";
echo "<ul>";
echo "<li>🔧 Cambiar DB_HOST de 127.0.0.1 a localhost</li>";
echo "<li>🔧 Crear tablas faltantes con migraciones</li>";
echo "<li>🔧 Limpiar caché de configuración</li>";
echo "</ul>";

echo "<p><strong>🗑️ Elimina este archivo:</strong> <code>rm " . $_SERVER['SCRIPT_FILENAME'] . "</code></p>";
?>
