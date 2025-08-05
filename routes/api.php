<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GpsTrackingController;
use App\Http\Controllers\Api\PdvVisitController;
use App\Http\Controllers\Api\UserDataController;
use App\Http\Controllers\Api\WorkingSessionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Rutas para la aplicación móvil de vendedores
| Todas las rutas (excepto login) requieren autenticación via Sanctum
|
*/

// Rutas públicas (sin autenticación)
Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->name('api.auth.login');
});

// Rutas protegidas (requieren autenticación)
Route::middleware(['auth:sanctum'])->group(function () {
    
    // ========================================
    // AUTENTICACIÓN Y PERFIL
    // ========================================
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout'])->name('api.auth.logout');
        Route::get('profile', [AuthController::class, 'profile'])->name('api.auth.profile');
        Route::post('refresh-token', [AuthController::class, 'refreshToken'])->name('api.auth.refresh');
    });

    // ========================================
    // DATOS DEL USUARIO (Circuitos, PDVs asignados)
    // ========================================
    Route::prefix('user')->group(function () {
        Route::get('circuits', [UserDataController::class, 'getUserCircuits'])->name('api.user.circuits');
        Route::get('pdvs-today', [UserDataController::class, 'getTodayPdvs'])->name('api.user.pdvs-today');
        Route::get('pdvs-by-circuit/{circuit}', [UserDataController::class, 'getPdvsByCircuit'])->name('api.user.pdvs-by-circuit');
        Route::get('stats', [UserDataController::class, 'getUserStats'])->name('api.user.stats');
    });

    // ========================================
    // GESTIÓN DE JORNADAS LABORALES
    // ========================================
    Route::prefix('working-sessions')->group(function () {
        Route::post('start', [WorkingSessionController::class, 'start'])->name('api.working-sessions.start');
        Route::post('end', [WorkingSessionController::class, 'end'])->name('api.working-sessions.end');
        Route::post('pause', [WorkingSessionController::class, 'pause'])->name('api.working-sessions.pause');
        Route::post('resume', [WorkingSessionController::class, 'resume'])->name('api.working-sessions.resume');
        Route::get('current', [WorkingSessionController::class, 'getCurrent'])->name('api.working-sessions.current');
        Route::get('history', [WorkingSessionController::class, 'getHistory'])->name('api.working-sessions.history');
    });

    // ========================================
    // TRACKING GPS
    // ========================================
    Route::prefix('gps')->group(function () {
        Route::post('location', [GpsTrackingController::class, 'recordLocation'])->name('api.gps.location');
        Route::post('batch-locations', [GpsTrackingController::class, 'recordBatchLocations'])->name('api.gps.batch');
        Route::get('my-route-today', [GpsTrackingController::class, 'getTodayRoute'])->name('api.gps.my-route');
    });

    // ========================================
    // VISITAS A PDVs
    // ========================================
    Route::prefix('pdv-visits')->group(function () {
        Route::post('check-in', [PdvVisitController::class, 'checkIn'])->name('api.pdv-visits.check-in');
        Route::post('check-out', [PdvVisitController::class, 'checkOut'])->name('api.pdv-visits.check-out');
        Route::post('upload-photo', [PdvVisitController::class, 'uploadPhoto'])->name('api.pdv-visits.upload-photo');
        Route::get('my-visits-today', [PdvVisitController::class, 'getTodayVisits'])->name('api.pdv-visits.today');
        Route::get('my-visits', [PdvVisitController::class, 'getMyVisits'])->name('api.pdv-visits.history');
        Route::get('visit/{visit}', [PdvVisitController::class, 'getVisitDetails'])->name('api.pdv-visits.details');
        Route::patch('visit/{visit}/update-data', [PdvVisitController::class, 'updateVisitData'])->name('api.pdv-visits.update-data');
    });

    // ========================================
    // RUTAS PARA EL DASHBOARD (SUPERVISORES/ADMINS)
    // ========================================
    Route::prefix('dashboard')->middleware(['role:Administrador|Supervisor'])->group(function () {
        Route::get('real-time-locations', [GpsTrackingController::class, 'getRealTimeLocations'])->name('api.dashboard.real-time');
        Route::get('user/{user}/route', [GpsTrackingController::class, 'getUserRoute'])->name('api.dashboard.user-route');
        Route::get('stats/general', [UserDataController::class, 'getGeneralStats'])->name('api.dashboard.general-stats');
        Route::get('active-vendors', [UserDataController::class, 'getActiveVendors'])->name('api.dashboard.active-vendors');
    });

});