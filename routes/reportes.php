<?php

use App\Http\Controllers\Reportes\PdvVisitadosController;
use App\Http\Controllers\Reportes\PdvVisitFormResponsesController;
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
    });
});
