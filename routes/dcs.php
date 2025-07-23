<?php

use App\Http\Controllers\DCS\ZonalController;
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

    });

});
