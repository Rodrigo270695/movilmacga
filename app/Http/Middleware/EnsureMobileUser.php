<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureMobileUser
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        // Verificar que el usuario esté autenticado
        if (!$user) {
            \Log::warning('EnsureMobileUser: Usuario no autenticado', [
                'endpoint' => $request->path(),
                'method' => $request->method(),
                'ip' => $request->ip(),
                'token_present' => $request->bearerToken() ? 'yes' : 'no'
            ]);
            return response()->json([
                'success' => false,
                'message' => 'No autenticado.',
            ], 401);
        }

        // Verificar que el usuario esté activo
        if (!$user->status) {
            \Log::warning('EnsureMobileUser: Usuario desactivado intentando acceder', [
                'user_id' => $user->id,
                'username' => $user->username,
                'endpoint' => $request->path(),
                'ip' => $request->ip()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Tu cuenta está desactivada. Contacta al administrador.',
            ], 403);
        }

        // Verificar que tenga rol de Vendedor o Supervisor
        if (!$user->hasAnyRole(['Vendedor', 'Supervisor'])) {
            \Log::warning('EnsureMobileUser: Usuario sin rol válido', [
                'user_id' => $user->id,
                'username' => $user->username,
                'roles' => $user->getRoleNames()->toArray(),
                'endpoint' => $request->path()
            ]);
            return response()->json([
                'success' => false,
                'message' => 'No tienes permisos para usar la aplicación móvil.',
            ], 403);
        }

        // Verificar que el token tenga los permisos necesarios
        $requiredAbilities = ['gps:record', 'visits:manage', 'sessions:manage'];
        $currentToken = $user->currentAccessToken();
        
        if (!$currentToken || !$currentToken->can($requiredAbilities)) {
            \Log::warning('EnsureMobileUser: Token sin permisos suficientes', [
                'user_id' => $user->id,
                'username' => $user->username,
                'endpoint' => $request->path(),
                'token_exists' => $currentToken ? 'yes' : 'no',
                'token_abilities' => $currentToken ? $currentToken->abilities : []
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Token sin permisos suficientes.',
            ], 403);
        }

        return $next($request);
    }
}