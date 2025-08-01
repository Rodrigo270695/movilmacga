<?php

use App\Http\Controllers\Mapas\TrackingController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Mapas Routes
|--------------------------------------------------------------------------
|
| Aquí se registran las rutas para los módulos de mapas y tracking GPS.
| Estas rutas están agrupadas bajo el middleware 'auth' y utilizan Inertia
| para renderizar las vistas React.
|
*/

// Grupo de rutas para el módulo de Mapas (requiere autenticación)
Route::middleware(['auth', 'verified'])->prefix('mapas')->name('mapas.')->group(function () {

    // Tracking GPS de vendedores
    Route::middleware(['permission:mapa-rastreo-vendedores-acceso'])->prefix('tracking')->name('tracking.')->group(function () {

        // Dashboard principal de tracking
        Route::get('/', [TrackingController::class, 'index'])->name('index');

        // API endpoints para datos en tiempo real
        Route::get('/locations/real-time', [TrackingController::class, 'getRealTimeLocations'])
            ->middleware('permission:mapa-rastreo-vendedores-tiempo-real')
            ->name('locations.real-time');

        // Historial de ubicaciones de un usuario específico
        Route::get('/users/{user}/history', [TrackingController::class, 'getUserLocationHistory'])
            ->middleware('permission:mapa-rastreo-vendedores-historial')
            ->name('users.history');

        // Estadísticas de actividad de un usuario
        Route::get('/users/{user}/stats', [TrackingController::class, 'getUserActivityStats'])
            ->middleware('permission:mapa-rastreo-vendedores-ver')
            ->name('users.stats');

        // PDVs cercanos a una ubicación
        Route::get('/pdvs/nearby', [TrackingController::class, 'getNearbyPdvs'])
            ->middleware('permission:mapa-rastreo-vendedores-ver')
            ->name('pdvs.nearby');

        // Ruta detallada de un usuario para una fecha específica
        Route::get('/users/{user}/route', [TrackingController::class, 'getUserRouteForDate'])
            ->middleware('permission:mapa-rastreo-vendedores-historial')
            ->name('users.route');
    });
});
