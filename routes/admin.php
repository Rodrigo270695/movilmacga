<?php

use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {

        // Grupo de rutas para roles con middleware de permisos
        Route::middleware(['permission:gestor-roles-acceso'])->group(function () {

            // Rutas específicas con permisos granulares
            Route::get('roles', [RoleController::class, 'index'])
                ->middleware('permission:gestor-roles-ver')
                ->name('roles.index');

            Route::post('roles', [RoleController::class, 'store'])
                ->middleware('permission:gestor-roles-crear')
                ->name('roles.store');

            Route::patch('roles/{role}', [RoleController::class, 'update'])
                ->middleware('permission:gestor-roles-editar|gestor-roles-asignar-permisos')
                ->name('roles.update');

            // Ruta para cambiar estado del rol
            Route::patch('roles/{role}/toggle-status', [RoleController::class, 'toggleStatus'])
                ->middleware('permission:gestor-roles-cambiar-estado')
                ->name('roles.toggle-status');

        });

        // Grupo de rutas para usuarios con middleware de permisos
        Route::middleware(['permission:gestor-usuarios-acceso'])->group(function () {

            // Rutas específicas con permisos granulares
            Route::get('users', [UserController::class, 'index'])
                ->middleware('permission:gestor-usuarios-ver')
                ->name('users.index');

            Route::post('users', [UserController::class, 'store'])
                ->middleware('permission:gestor-usuarios-crear')
                ->name('users.store');

            Route::patch('users/{user}', [UserController::class, 'update'])
                ->middleware('permission:gestor-usuarios-editar')
                ->name('users.update');

            // Ruta para cambiar estado del usuario
            Route::patch('users/{user}/toggle-status', [UserController::class, 'toggleStatus'])
                ->middleware('permission:gestor-usuarios-cambiar-estado')
                ->name('users.toggle-status');

        });
    });
