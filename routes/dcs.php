<?php

use App\Http\Controllers\DCS\ZonalController;
use App\Http\Controllers\DCS\CircuitController;
use App\Http\Controllers\DCS\GlobalCircuitController;
use App\Http\Controllers\DCS\RouteController;
use App\Http\Controllers\DCS\GlobalRouteController;
use App\Http\Controllers\DCS\GlobalPdvController;
use App\Http\Controllers\DCS\ZonalSupervisorController;
use App\Http\Controllers\DCS\VendorCircuitController;
use App\Http\Controllers\DCS\RouteVisitDateController;
use App\Http\Controllers\DCS\PdvChangeRequestController;
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

            // Ruta para actualizar frecuencias de circuito
            Route::post('circuits/{circuit}/frequencies', [CircuitController::class, 'updateFrequencies'])
                ->middleware('permission:gestor-circuito-ver')
                ->name('circuits.frequencies.update');

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



            // Rutas para fechas de visita de rutas
            Route::get('routes/{route}/visit-dates', [RouteVisitDateController::class, 'index'])
                ->middleware('permission:gestor-ruta-ver')
                ->name('routes.visit-dates.index');

            Route::post('routes/{route}/visit-dates', [RouteVisitDateController::class, 'store'])
                ->middleware('permission:gestor-ruta-editar')
                ->name('routes.visit-dates.store');

            Route::patch('routes/{route}/visit-dates/{visitDate}', [RouteVisitDateController::class, 'update'])
                ->middleware('permission:gestor-ruta-editar')
                ->name('routes.visit-dates.update');

            Route::delete('routes/{route}/visit-dates/{visitDate}', [RouteVisitDateController::class, 'destroy'])
                ->middleware('permission:gestor-ruta-editar')
                ->name('routes.visit-dates.destroy');

            Route::delete('routes/{route}/visit-dates', [RouteVisitDateController::class, 'destroyMultiple'])
                ->middleware('permission:gestor-ruta-editar')
                ->name('routes.visit-dates.destroy-multiple');

            Route::get('routes/{route}/visit-dates/range', [RouteVisitDateController::class, 'getDatesForRange'])
                ->middleware('permission:gestor-ruta-ver')
                ->name('routes.visit-dates.range');

            // Ruta para exportar rutas a Excel
            Route::get('routes/export', [GlobalRouteController::class, 'export'])
                ->middleware('permission:gestor-ruta-ver')
                ->name('routes.export');

        });

        // Grupo de rutas globales para PDVs con middleware de permisos
        Route::middleware(['permission:gestor-pdv-acceso'])->group(function () {

            // Rutas globales con permisos granulares
            Route::get('pdvs', [GlobalPdvController::class, 'index'])
                ->middleware('permission:gestor-pdv-ver')
                ->name('pdvs.index');

            Route::post('pdvs', [GlobalPdvController::class, 'store'])
                ->middleware('permission:gestor-pdv-crear')
                ->name('pdvs.store');

            Route::patch('pdvs/{pdv}', [GlobalPdvController::class, 'update'])
                ->middleware('permission:gestor-pdv-editar')
                ->name('pdvs.update');

            // Ruta para cambiar estado del PDV (global)
            Route::patch('pdvs/{pdv}/toggle-status', [GlobalPdvController::class, 'toggleStatus'])
                ->middleware('permission:gestor-pdv-cambiar-estado')
                ->name('pdvs.toggle-status');

            // Ruta para eliminar PDV (global)
            Route::delete('pdvs/{pdv}', [GlobalPdvController::class, 'destroy'])
                ->middleware('permission:gestor-pdv-eliminar')
                ->name('pdvs.destroy');

            // Ruta para exportar PDVs a Excel
            Route::get('pdvs/export', [GlobalPdvController::class, 'export'])
                ->middleware('permission:gestor-pdv-ver')
                ->name('pdvs.export');



        });

        // Grupo de rutas para asignación de supervisores a zonales
        Route::middleware(['permission:gestor-zonal-supervisor-acceso'])->group(function () {

            // Vista principal de asignaciones supervisor-zonal
            Route::get('zonal-supervisors', [ZonalSupervisorController::class, 'index'])
                ->middleware('permission:gestor-zonal-supervisor-ver')
                ->name('zonal-supervisors.index');

            // Asignar supervisor a zonal
            Route::post('zonal-supervisors', [ZonalSupervisorController::class, 'store'])
                ->middleware('permission:gestor-zonal-supervisor-asignar')
                ->name('zonal-supervisors.store');

            // Actualizar asignación de supervisor
            Route::put('zonal-supervisors/{zonalSupervisor}', [ZonalSupervisorController::class, 'update'])
                ->middleware('permission:gestor-zonal-supervisor-asignar')
                ->name('zonal-supervisors.update');

            // Desasignar supervisor de zonal
            Route::delete('zonal-supervisors/{zonalSupervisor}', [ZonalSupervisorController::class, 'destroy'])
                ->middleware('permission:gestor-zonal-supervisor-desasignar')
                ->name('zonal-supervisors.destroy');

        });

        // Grupo de rutas para asignación de vendedores a circuitos (por supervisores)
        Route::middleware(['permission:gestor-vendedor-circuito-acceso'])->group(function () {

            // Vista principal de asignaciones vendedor-circuito
            Route::get('vendor-circuits', [VendorCircuitController::class, 'index'])
                ->middleware('permission:gestor-vendedor-circuito-ver')
                ->name('vendor-circuits.index');

            // Asignar vendedor a circuito
            Route::post('vendor-circuits', [VendorCircuitController::class, 'store'])
                ->middleware('permission:gestor-vendedor-circuito-asignar')
                ->name('vendor-circuits.store');

            // Reasignar vendedor a circuito
            Route::put('vendor-circuits/{userCircuit}', [VendorCircuitController::class, 'update'])
                ->middleware('permission:gestor-vendedor-circuito-asignar')
                ->name('vendor-circuits.update');

            // Desasignar vendedor de circuito
            Route::delete('vendor-circuits/{userCircuit}', [VendorCircuitController::class, 'destroy'])
                ->middleware('permission:gestor-vendedor-circuito-desasignar')
                ->name('vendor-circuits.destroy');

        });

        // Grupo de rutas para aprobaciones de cambios PDV
        Route::middleware(['permission:gestor-pdv-aprobaciones-acceso'])->group(function () {

            // Vista principal de aprobaciones PDV
            Route::get('pdv-change-requests', [PdvChangeRequestController::class, 'index'])
                ->middleware('permission:gestor-pdv-aprobaciones-ver')
                ->name('pdv-change-requests.index');

            // Aprobar solicitud de cambio
            Route::post('pdv-change-requests/{changeRequest}/approve', [PdvChangeRequestController::class, 'approve'])
                ->middleware('permission:gestor-pdv-aprobaciones-aprobar')
                ->name('pdv-change-requests.approve');

            // Rechazar solicitud de cambio
            Route::post('pdv-change-requests/{changeRequest}/reject', [PdvChangeRequestController::class, 'reject'])
                ->middleware('permission:gestor-pdv-aprobaciones-rechazar')
                ->name('pdv-change-requests.reject');

        });

        // Exportar solicitudes de cambio a Excel (sin requerir permisos adicionales)
        Route::get('pdv-change-requests/export', [PdvChangeRequestController::class, 'export'])
            ->name('pdv-change-requests.export');

        // ========================================
        // RUTAS AJAX PARA CARGA DINÁMICA (SIN MIDDLEWARE DE PERMISOS)
        // ========================================

        // Obtener PDVs de una ruta específica (para mapa) - sin middleware de permiso adicional
        Route::get('routes/{route}/pdvs', [GlobalPdvController::class, 'getRoutePdvs'])
            ->name('routes.pdvs');

        // Obtener PDVs de un zonal específico (para mapa) - sin middleware de permiso adicional
        Route::get('zonales/{zonal}/pdvs', [GlobalPdvController::class, 'getZonalPdvs'])
            ->name('zonales.pdvs');

        // Obtener provincias por departamento
        Route::get('ajax/provincias', [GlobalPdvController::class, 'getProvinciasByDepartamento'])
            ->name('dcs.ajax.provincias');

        // Obtener distritos por provincia
        Route::get('ajax/distritos', [GlobalPdvController::class, 'getDistritosByProvincia'])
            ->name('dcs.ajax.distritos');

        // Buscar localidades por distrito (con filtro de texto)
        Route::get('ajax/localidades', [GlobalPdvController::class, 'searchLocalidades'])
            ->name('dcs.ajax.localidades');

        // Obtener circuitos por zonal
        Route::get('ajax/circuits', [GlobalPdvController::class, 'getCircuitsByZonal'])
            ->name('dcs.ajax.circuits');

        // Obtener rutas por circuito
        Route::get('ajax/routes', [GlobalPdvController::class, 'getRoutesByCircuit'])
            ->name('dcs.ajax.routes');

        // Obtener detalles completos del PDV para edición
        Route::get('ajax/pdv-details/{pdv}', [GlobalPdvController::class, 'getPdvDetails'])
            ->name('dcs.ajax.pdv-details');

    });

});

