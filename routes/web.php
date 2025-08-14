<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return redirect()->route('login');
})->name('home');

// Ruta para crear el storage link (solo para producción)
Route::get('/create-storage-link', function () {
    try {
        // Definir las rutas específicas para tu configuración
        $storagePath = __DIR__ . '/../storage/app/public';
        $publicStoragePath = __DIR__ . '/../../public_html/movilmacga.grupomaclabi.com/storage';

        // Información de diagnóstico
        $diagnostic = [
            'current_dir' => __DIR__,
            'storage_path' => $storagePath,
            'public_storage_path' => $publicStoragePath,
            'storage_exists' => file_exists($storagePath),
            'public_storage_exists' => file_exists($publicStoragePath),
            'is_writable' => is_writable(dirname($publicStoragePath)),
            'php_version' => PHP_VERSION,
            'os' => PHP_OS
        ];

        // Verificar si el enlace ya existe
        if (file_exists($publicStoragePath)) {
            return response()->json([
                'success' => false,
                'message' => 'El enlace de storage ya existe en: ' . $publicStoragePath,
                'diagnostic' => $diagnostic
            ]);
        }

        // Verificar que el directorio de storage existe
        if (!file_exists($storagePath)) {
            return response()->json([
                'success' => false,
                'message' => 'El directorio de storage no existe en: ' . $storagePath,
                'diagnostic' => $diagnostic
            ]);
        }

        // Verificar permisos de escritura en el directorio público
        if (!is_writable(dirname($publicStoragePath))) {
            return response()->json([
                'success' => false,
                'message' => 'No hay permisos de escritura en el directorio público: ' . dirname($publicStoragePath),
                'diagnostic' => $diagnostic
            ]);
        }

        // Crear el enlace simbólico
        $result = symlink($storagePath, $publicStoragePath);

        if ($result) {
            return response()->json([
                'success' => true,
                'message' => 'Enlace de storage creado exitosamente en: ' . $publicStoragePath,
                'storage_path' => $storagePath,
                'public_path' => $publicStoragePath,
                'diagnostic' => $diagnostic
            ]);
        } else {
            // Intentar método alternativo usando exec si está disponible
            if (function_exists('exec')) {
                $command = "ln -s " . escapeshellarg($storagePath) . " " . escapeshellarg($publicStoragePath);
                exec($command, $output, $returnCode);

                if ($returnCode === 0) {
                    return response()->json([
                        'success' => true,
                        'message' => 'Enlace de storage creado exitosamente usando comando ln -s',
                        'command' => $command,
                        'diagnostic' => $diagnostic
                    ]);
                }
            }

            return response()->json([
                'success' => false,
                'message' => 'Error al crear el enlace de storage. Verifica permisos y configuración del servidor.',
                'diagnostic' => $diagnostic
            ]);
        }
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage(),
            'diagnostic' => [
                'current_dir' => __DIR__,
                'storage_path' => $storagePath ?? 'no definido',
                'public_storage_path' => $publicStoragePath ?? 'no definido'
            ]
        ]);
    }
})->name('create.storage.link');

// Ruta para limpiar permisos y cache (como solicitaste)
Route::get('/clear-permissions', function () {
    try {
        \Illuminate\Support\Facades\Artisan::call('permission:cache-reset');
        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        return response()->json([
            'success' => true,
            'message' => 'Permisos y cache limpiados exitosamente'
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
})->name('clear.permissions');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
require __DIR__.'/admin.php';
require __DIR__.'/dcs.php';
require __DIR__.'/mapas.php';
require __DIR__.'/reportes.php';
