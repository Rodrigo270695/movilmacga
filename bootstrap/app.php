<?php

use App\Http\Middleware\HandleAppearance;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\CheckUserStatus;
use App\Http\Middleware\EnsureMobileUser;
use App\Http\Middleware\BusinessScopeMiddleware;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Facade;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('web')
                ->group(base_path('routes/dcs.php'));

            Route::middleware('web')
                ->group(base_path('routes/admin.php'));

            Route::middleware('web')
                ->group(base_path('routes/auth.php'));

            Route::middleware('web')
                ->group(base_path('routes/settings.php'));

            Route::middleware('web')
                ->group(base_path('routes/mapas.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);

        // Middleware para rutas WEB
        $middleware->web(append: [
            HandleAppearance::class,
            HandleInertiaRequests::class,
            CheckUserStatus::class,
            BusinessScopeMiddleware::class,
            AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Middleware para rutas API
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \App\Http\Middleware\CorsMiddleware::class,
        ]);

        // Registrar middleware y aliases de servicios
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'mobile.user' => EnsureMobileUser::class,
        ]);

        // Configurar throttling para APIs
        $middleware->throttleApi();
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Renderizar páginas de error personalizadas para Inertia
        $exceptions->render(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, \Illuminate\Http\Request $request) {
            if ($request->header('X-Inertia')) {
                return \Inertia\Inertia::render('errors/404')->toResponse($request)->setStatusCode(404);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->header('X-Inertia')) {
                return \Inertia\Inertia::render('errors/401')->toResponse($request)->setStatusCode(401);
            }
        });

        $exceptions->render(function (\Illuminate\Auth\Access\AuthorizationException $e, \Illuminate\Http\Request $request) {
            if ($request->header('X-Inertia')) {
                return \Inertia\Inertia::render('errors/403')->toResponse($request)->setStatusCode(403);
            }
        });
    })->create();
