<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\GpsTrackingController;
use App\Http\Controllers\Api\PdvVisitController;
use App\Http\Controllers\Api\UserDataController;
use App\Http\Controllers\Api\WorkingSessionController;
use App\Http\Controllers\Api\FormController;
use App\Http\Controllers\Api\CircuitRoutesController;
use App\Http\Controllers\Api\RoutePdvsController;
use App\Http\Controllers\Api\PdvFormController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RouteController;
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
    // PERFIL DEL USUARIO
    // ========================================
                    Route::prefix('profile')->group(function () {
                    Route::get('stats', [ProfileController::class, 'getUserStats'])->name('api.profile.stats');
                    Route::get('info', [ProfileController::class, 'getProfileInfo'])->name('api.profile.info');
                    Route::post('change-password', [ProfileController::class, 'changePassword'])->name('api.profile.change-password');
                    Route::put('update', [ProfileController::class, 'updateProfile'])->name('api.profile.update');
                });

    // ========================================
    // DATOS DEL USUARIO (Circuitos, PDVs asignados)
    // ========================================
    Route::prefix('user')->group(function () {
        Route::get('circuits', [UserDataController::class, 'getUserCircuits'])->name('api.user.circuits');
        Route::get('pdvs-today', [UserDataController::class, 'getTodayPdvs'])->name('api.user.pdvs-today');
        Route::get('pdvs-by-circuit/{circuit}', [UserDataController::class, 'getPdvsByCircuit'])->name('api.user.pdvs-by-circuit');
        Route::get('circuit/{circuit}/routes-with-dates', [UserDataController::class, 'getCircuitRoutesWithDates'])->name('api.user.circuit-routes-with-dates');
        Route::get('stats', [UserDataController::class, 'getUserStats'])->name('api.user.stats');
    });

    // ========================================
    // RUTAS DE CIRCUITOS (Nuevo controlador)
    // ========================================
    Route::prefix('circuit-routes')->group(function () {
        Route::get('{circuit}/all', [CircuitRoutesController::class, 'getCircuitRoutes'])->name('api.circuit-routes.all');
        Route::get('{circuit}/today', [CircuitRoutesController::class, 'getTodayCircuitRoutes'])->name('api.circuit-routes.today');
    });

    // ========================================
    // PDVs DE RUTAS (Nuevo controlador)
    // ========================================
    Route::prefix('route-pdvs')->group(function () {
    Route::get('{route}/all', [RoutePdvsController::class, 'getRoutePdvs'])->name('api.route-pdvs.all');
    Route::get('{route}/today', [RoutePdvsController::class, 'getTodayRoutePdvs'])->name('api.route-pdvs.today');
});

    // ========================================
    // RUTAS PARA MAPAS (Dashboard)
    // ========================================
    Route::prefix('routes')->group(function () {
        Route::get('{route}/pdvs', [RouteController::class, 'getPdvs'])->name('api.routes.pdvs');
    });

Route::prefix('pdv-forms')->group(function () {
    Route::get('{pdv}', [PdvFormController::class, 'getPdvForm'])->name('api.pdv-forms.get');
    Route::post('{pdv}/responses', [PdvFormController::class, 'saveFormResponses'])->name('api.pdv-forms.save-responses');
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
    // FORMULARIOS DINÁMICOS
    // ========================================
    Route::prefix('forms')->group(function () {
        // Obtener formulario asignado a un PDV
        Route::get('pdv/{pdvId}', [FormController::class, 'getPdvForm'])->name('api.forms.pdv-form');

        // Guardar respuestas del formulario para una visita
        Route::post('visit/{visitId}/responses', [FormController::class, 'saveFormResponses'])->name('api.forms.save-responses');

        // Subir archivo para un campo específico
        Route::post('visit/{visitId}/field/{fieldId}/upload', [FormController::class, 'uploadFile'])->name('api.forms.upload-file');

        // Obtener respuestas de una visita específica
        Route::get('visit/{visitId}/responses', [FormController::class, 'getVisitResponses'])->name('api.forms.get-responses');
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
