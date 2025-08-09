<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\Auth;

class FilterByBusiness
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return $next($request);
        }

        // Obtener los negocios del usuario
        $userBusinesses = $user->activeBusinesses()->pluck('id')->toArray();

        if (empty($userBusinesses)) {
            // Si el usuario no tiene negocios asignados, no mostrar datos
            return $next($request);
        }

        // Agregar los IDs de negocios a la request para que los controladores los usen
        $request->merge(['user_business_ids' => $userBusinesses]);

        return $next($request);
    }
}
