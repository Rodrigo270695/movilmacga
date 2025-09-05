<?php

use App\Http\Controllers\Reportes\PdvVisitadosController;
use App\Http\Controllers\Reportes\PdvVisitFormResponsesController;
use App\Http\Controllers\Reportes\WorkingSessionsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::prefix('reportes')->name('reportes.')->group(function () {
        // Reporte de PDVs Visitados
        Route::get('pdvs-visitados', [PdvVisitadosController::class, 'index'])
            ->name('pdvs-visitados.index')
            ->middleware('permission:reporte-pdvs-visitados-acceso');

        Route::get('pdvs-visitados/exportar', [PdvVisitadosController::class, 'exportar'])
            ->name('pdvs-visitados.exportar')
            ->middleware('permission:reporte-pdvs-visitados-exportar');

        // Respuestas de formularios de visita
        Route::get('pdvs-visitados/{visit}/formulario', [PdvVisitFormResponsesController::class, 'show'])
            ->name('pdvs-visitados.formulario')
            ->middleware('permission:reporte-pdvs-visitados-ver');

        // Eliminar visita (solo in_progress) - Acceso universal para usuarios autenticados
        Route::delete('pdvs-visitados/{visit}', [PdvVisitadosController::class, 'destroy'])
            ->name('pdvs-visitados.destroy');

        // ========================================
        // REPORTE DE JORNADAS LABORALES
        // ========================================
        Route::get('jornadas-laborales', [WorkingSessionsController::class, 'index'])
            ->name('jornadas-laborales.index')
            ->middleware('permission:reporte-jornadas-laborales-acceso');

        Route::get('jornadas-laborales/exportar', [WorkingSessionsController::class, 'export'])
            ->name('jornadas-laborales.exportar')
            ->middleware('permission:reporte-jornadas-laborales-exportar');

        Route::get('jornadas-laborales/pdv-visits', [WorkingSessionsController::class, 'getPdvVisits'])
            ->name('jornadas-laborales.pdv-visits')
            ->middleware('permission:reporte-jornadas-laborales-ver');

        Route::get('jornadas-laborales/gps-tracking', [WorkingSessionsController::class, 'getGpsTracking'])
            ->name('jornadas-laborales.gps-tracking')
            ->middleware('permission:reporte-jornadas-laborales-ver');

        Route::get('jornadas-laborales/{session}', [WorkingSessionsController::class, 'show'])
            ->name('jornadas-laborales.show')
            ->middleware('permission:reporte-jornadas-laborales-ver');

        Route::get('jornadas-laborales/{session}/mapa', [WorkingSessionsController::class, 'getMapData'])
            ->name('jornadas-laborales.mapa')
            ->middleware('permission:reporte-jornadas-laborales-ver');
    });
});
