<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class CheckUserStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Solo verificar si hay un usuario autenticado
        if (Auth::check()) {
            $user = Auth::user();
            
            // Si el usuario está desactivado
            if (!$user->status) {
                // Cerrar sesión
                Auth::logout();
                
                // Invalidar la sesión
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                
                // Si es una petición de Inertia (AJAX), devolver error
                if ($request->header('X-Inertia')) {
                    return response()->json([
                        'message' => 'Tu cuenta ha sido desactivada. Serás redirigido al login.',
                    ], 401);
                }
                
                // Si es una petición normal, redirigir al login con mensaje
                return redirect()->route('login')->with('error', 'Tu cuenta ha sido desactivada. Contacta al administrador.');
            }
        }

        return $next($request);
    }
}
