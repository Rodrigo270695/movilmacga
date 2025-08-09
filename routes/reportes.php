<?php

use App\Http\Controllers\Reportes\PdvVisitadosController;
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
    });
});
