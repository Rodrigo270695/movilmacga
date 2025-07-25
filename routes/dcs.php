<?php

use App\Http\Controllers\DCS\ZonalController;
use App\Http\Controllers\DCS\CircuitController;
use App\Http\Controllers\DCS\GlobalCircuitController;
use App\Http\Controllers\DCS\RouteController;
use App\Http\Controllers\DCS\GlobalRouteController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| DCS Routes
|--------------------------------------------------------------------------
|
| Rutas para el módulo DCS (Data Control System)
| Todas las rutas están protegidas por autenticación y permisos específicos
|
*/

Route::middleware(['auth', 'verified'])->group(function () {

    Route::prefix('dcs')->name('dcs.')->group(function () {

        // Grupo de rutas para zonales con middleware de permisos
        Route::middleware(['permission:gestor-zonal-acceso'])->group(function () {

            // Rutas específicas con permisos granulares
            Route::get('zonales', [ZonalController::class, 'index'])
                ->middleware('permission:gestor-zonal-ver')
                ->name('zonales.index');

            Route::post('zonales', [ZonalController::class, 'store'])
                ->middleware('permission:gestor-zonal-crear')
                ->name('zonales.store');

            Route::patch('zonales/{zonal}', [ZonalController::class, 'update'])
                ->middleware('permission:gestor-zonal-editar')
                ->name('zonales.update');

            // Ruta para cambiar estado del zonal
            Route::patch('zonales/{zonal}/toggle-status', [ZonalController::class, 'toggleStatus'])
                ->middleware('permission:gestor-zonal-cambiar-estado')
                ->name('zonales.toggle-status');

            // Ruta para eliminar zonal (si se requiere en el futuro)
            Route::delete('zonales/{zonal}', [ZonalController::class, 'destroy'])
                ->middleware('permission:gestor-zonal-eliminar')
                ->name('zonales.destroy');

        });

        // Grupo de rutas para circuitos con middleware de permisos
        Route::middleware(['permission:gestor-circuito-acceso'])->group(function () {

            // Vista global de circuitos (acceso directo desde sidebar)
            Route::get('circuits', [GlobalCircuitController::class, 'index'])
                ->middleware('permission:gestor-circuito-ver')
                ->name('circuits.index');

            // Rutas específicas con permisos granulares para circuitos (jerárquico)
            Route::get('zonales/{zonal}/circuits', [CircuitController::class, 'index'])
                ->middleware('permission:gestor-circuito-ver')
                ->name('zonales.circuits.index');

            Route::post('zonales/{zonal}/circuits', [CircuitController::class, 'store'])
                ->middleware('permission:gestor-circuito-crear')
                ->name('zonales.circuits.store');

            Route::patch('zonales/{zonal}/circuits/{circuit}', [CircuitController::class, 'update'])
                ->middleware('permission:gestor-circuito-editar')
                ->name('zonales.circuits.update');

            // Ruta para cambiar estado del circuito
            Route::patch('zonales/{zonal}/circuits/{circuit}/toggle-status', [CircuitController::class, 'toggleStatus'])
                ->middleware('permission:gestor-circuito-cambiar-estado')
                ->name('zonales.circuits.toggle-status');

            // Ruta para eliminar circuito (si se requiere en el futuro)
            Route::delete('zonales/{zonal}/circuits/{circuit}', [CircuitController::class, 'destroy'])
                ->middleware('permission:gestor-circuito-eliminar')
                ->name('zonales.circuits.destroy');

        });

        // Grupo de rutas para rutas con middleware de permisos (jerárquico)
        Route::middleware(['permission:gestor-ruta-acceso'])->group(function () {

            // Rutas específicas con permisos granulares para rutas (contexto del circuito jerárquico)
            Route::get('zonales/{zonal}/circuits/{circuit}/routes', [RouteController::class, 'index'])
                ->middleware('permission:gestor-ruta-ver')
                ->name('zonales.circuits.routes.index');

            Route::post('zonales/{zonal}/circuits/{circuit}/routes', [RouteController::class, 'store'])
                ->middleware('permission:gestor-ruta-crear')
                ->name('zonales.circuits.routes.store');

            Route::patch('zonales/{zonal}/circuits/{circuit}/routes/{route}', [RouteController::class, 'update'])
                ->middleware('permission:gestor-ruta-editar')
                ->name('zonales.circuits.routes.update');

            // Ruta para cambiar estado de la ruta
            Route::patch('zonales/{zonal}/circuits/{circuit}/routes/{route}/toggle-status', [RouteController::class, 'toggleStatus'])
                ->middleware('permission:gestor-ruta-cambiar-estado')
                ->name('zonales.circuits.routes.toggle-status');

            // Ruta para eliminar ruta (si se requiere en el futuro)
            Route::delete('zonales/{zonal}/circuits/{circuit}/routes/{route}', [RouteController::class, 'destroy'])
                ->middleware('permission:gestor-ruta-eliminar')
                ->name('zonales.circuits.routes.destroy');

        });

        // Grupo de rutas globales para circuitos con middleware de permisos
        Route::middleware(['permission:gestor-circuito-acceso'])->group(function () {

            // Rutas globales con permisos granulares
            Route::post('circuits', [GlobalCircuitController::class, 'store'])
                ->middleware('permission:gestor-circuito-crear')
                ->name('circuits.store');

            Route::patch('circuits/{circuit}', [GlobalCircuitController::class, 'update'])
                ->middleware('permission:gestor-circuito-editar')
                ->name('circuits.update');

            // Ruta para cambiar estado del circuito (global)
            Route::patch('circuits/{circuit}/toggle-status', [GlobalCircuitController::class, 'toggleStatus'])
                ->middleware('permission:gestor-circuito-cambiar-estado')
                ->name('circuits.toggle-status');

            // Ruta para eliminar circuito (global)
            Route::delete('circuits/{circuit}', [GlobalCircuitController::class, 'destroy'])
                ->middleware('permission:gestor-circuito-eliminar')
                ->name('circuits.destroy');

        });

        // Grupo de rutas globales para rutas con middleware de permisos
        Route::middleware(['permission:gestor-ruta-acceso'])->group(function () {

            // Rutas globales con permisos granulares
            Route::get('routes', [GlobalRouteController::class, 'index'])
                ->middleware('permission:gestor-ruta-ver')
                ->name('routes.index');

            Route::post('routes', [GlobalRouteController::class, 'store'])
                ->middleware('permission:gestor-ruta-crear')
                ->name('routes.store');

            Route::patch('routes/{route}', [GlobalRouteController::class, 'update'])
                ->middleware('permission:gestor-ruta-editar')
                ->name('routes.update');

            // Ruta para cambiar estado de la ruta (global)
            Route::patch('routes/{route}/toggle-status', [GlobalRouteController::class, 'toggleStatus'])
                ->middleware('permission:gestor-ruta-cambiar-estado')
                ->name('routes.toggle-status');

            // Ruta para eliminar ruta (global)
            Route::delete('routes/{route}', [GlobalRouteController::class, 'destroy'])
                ->middleware('permission:gestor-ruta-eliminar')
                ->name('routes.destroy');

        });

    });

});
