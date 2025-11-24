<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\View;

class BusinessScopeMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure(\Illuminate\Http\Request): (\Illuminate\Http\Response|\Illuminate\Http\RedirectResponse)  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\RedirectResponse
     */
    public function handle(Request $request, Closure $next)
    {
        $user = Auth::user();

        if (!$user) {
            return $next($request);
        }

        // Verificar si es Vendedor (bypasear completamente el middleware)
        if ($user->hasRole('Vendedor')) {
            // No aplicar ningún filtro, dejar pasar como si no existiera el middleware
            $this->shareGlobalScope([
                'is_admin' => true, // Tratar como admin para no aplicar filtros
                'business_id' => null,
                'business_ids' => [],
                'zonal_ids' => [],
                'has_business_restriction' => false,
                'has_zonal_restriction' => false
            ]);
            return $next($request);
        }

        // Verificar si es Administrador (acceso completo)
        if ($user->hasRole('Administrador')) {
            $this->shareGlobalScope([
                'is_admin' => true,
                'business_id' => null,
                'business_ids' => [],
                'zonal_ids' => [],
                'has_business_restriction' => false,
                'has_zonal_restriction' => false
            ]);
            return $next($request);
        }

        // Cachear scope de negocio para evitar consultas pesadas en cada request
        $cacheKey = "business_scope_user_{$user->id}";
        $businessScope = \Illuminate\Support\Facades\Cache::remember($cacheKey, 300, function () use ($user) {
            // Obtener negocios activos del usuario
            $userBusinesses = $user->activeBusinesses()->pluck('businesses.id');

            // Obtener zonales donde es supervisor activo
            $userZonalIds = $user->activeZonalSupervisorAssignments()
                ->with('zonal')
                ->get()
                ->pluck('zonal.id');

            return [
                'is_admin' => false,
                'business_id' => $userBusinesses->count() === 1 ? $userBusinesses->first() : null,
                'business_ids' => $userBusinesses->toArray(),
                'zonal_ids' => $userZonalIds->toArray(),
                'has_business_restriction' => $userBusinesses->count() > 0,
                'has_zonal_restriction' => $userZonalIds->count() > 0
            ];
        });

        // Compartir el scope globalmente para usar en controladores y vistas
        $this->shareGlobalScope($businessScope);

        // Agregar el scope al request para usar en controladores
        $request->merge(['business_scope' => $businessScope]);

        return $next($request);
    }

    /**
     * Compartir el scope globalmente
     */
    private function shareGlobalScope(array $scope)
    {
        // Compartir con las vistas
        View::share('businessScope', $scope);

        // Agregar al contexto de la aplicación
        app()->instance('business.scope', $scope);
    }
}
