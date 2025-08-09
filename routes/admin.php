<?php

use App\Http\Controllers\Admin\RoleController;
use App\Http\Controllers\Admin\BusinessController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\BusinessUserController;
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

        // Grupo de rutas para businesses con middleware de permisos
        Route::middleware(['permission:gestor-business-acceso'])->group(function () {

            // Rutas específicas con permisos granulares
            Route::get('businesses', [BusinessController::class, 'index'])
                ->middleware('permission:gestor-business-ver')
                ->name('businesses.index');

            Route::post('businesses', [BusinessController::class, 'store'])
                ->middleware('permission:gestor-business-crear')
                ->name('businesses.store');

            Route::patch('businesses/{business}', [BusinessController::class, 'update'])
                ->middleware('permission:gestor-business-editar')
                ->name('businesses.update');

            // Ruta para cambiar estado del business
            Route::patch('businesses/{business}/toggle-status', [BusinessController::class, 'toggleStatus'])
                ->middleware('permission:gestor-business-cambiar-estado')
                ->name('businesses.toggle-status');

            // Ruta para eliminar business
            Route::delete('businesses/{business}', [BusinessController::class, 'destroy'])
                ->middleware('permission:gestor-business-eliminar')
                ->name('businesses.destroy');

            // Ruta para obtener detalles del business (para edición)
            Route::get('businesses/{business}', [BusinessController::class, 'show'])
                ->middleware('permission:gestor-business-ver')
                ->name('businesses.show');

        });

        // Grupo de rutas para business-users con middleware de permisos
        Route::middleware(['permission:gestor-business-user-acceso'])->group(function () {

            // Rutas específicas con permisos granulares
            Route::get('business-users', [BusinessUserController::class, 'index'])
                ->middleware('permission:gestor-business-user-ver')
                ->name('business-users.index');

            Route::post('business-users', [BusinessUserController::class, 'store'])
                ->middleware('permission:gestor-business-user-asignar')
                ->name('business-users.store');

            Route::patch('business-users/{id}', [BusinessUserController::class, 'update'])
                ->middleware('permission:gestor-business-user-asignar')
                ->name('business-users.update');

            // Ruta para desasignar usuario
            Route::delete('business-users/{id}', [BusinessUserController::class, 'destroy'])
                ->middleware('permission:gestor-business-user-desasignar')
                ->name('business-users.destroy');

            // Ruta para ver todos los usuarios de un negocio
            Route::get('business-users/{business}/users', [BusinessUserController::class, 'showUsers'])
                ->middleware('permission:gestor-business-user-ver')
                ->name('business-users.users');

            // Ruta para desasignar un usuario específico de un negocio
            Route::delete('business-users/{business}/users/{user}', [BusinessUserController::class, 'unassignUser'])
                ->middleware('permission:gestor-business-user-desasignar')
                ->name('business-users.unassign-user');

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
