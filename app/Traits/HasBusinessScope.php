<?php

namespace App\Traits;

use Illuminate\Support\Facades\Auth;

trait HasBusinessScope
{
    /**
     * Obtener el scope de negocio del usuario actual
     */
    protected function getBusinessScope(): array
    {
        return app('business.scope') ?? [
            'is_admin' => false,
            'business_id' => null,
            'business_ids' => [],
            'zonal_ids' => [],
            'has_business_restriction' => false,
            'has_zonal_restriction' => false
        ];
    }

    /**
     * Verificar si el usuario es administrador
     */
    protected function isAdmin(): bool
    {
        return $this->getBusinessScope()['is_admin'];
    }

    /**
     * Verificar si el usuario está restringido a un negocio específico
     */
    protected function hasBusinessRestriction(): bool
    {
        return $this->getBusinessScope()['has_business_restriction'];
    }

    /**
     * Verificar si el usuario está restringido a zonales específicos
     */
    protected function hasZonalRestriction(): bool
    {
        return $this->getBusinessScope()['has_zonal_restriction'];
    }

    /**
     * Obtener el ID del negocio (si solo pertenece a uno)
     */
    protected function getBusinessId(): ?int
    {
        return $this->getBusinessScope()['business_id'];
    }

    /**
     * Obtener todos los IDs de negocios del usuario
     */
    protected function getBusinessIds(): array
    {
        return $this->getBusinessScope()['business_ids'];
    }

    /**
     * Obtener los IDs de zonales donde es supervisor
     */
    protected function getZonalIds(): array
    {
        return $this->getBusinessScope()['zonal_ids'];
    }

    /**
     * Aplicar filtros de negocio a una query
     */
    protected function applyBusinessScope($query, string $businessColumn = 'business_id')
    {
        if ($this->isAdmin()) {
            return $query; // Administradores ven todo
        }

        if ($this->hasBusinessRestriction()) {
            $businessIds = $this->getBusinessIds();
            if (!empty($businessIds)) {
                $query->whereIn($businessColumn, $businessIds);
            }
        }

        return $query;
    }

    /**
     * Aplicar filtros de zonal a una query
     */
    protected function applyZonalScope($query, string $zonalColumn = 'zonal_id')
    {
        if ($this->isAdmin()) {
            return $query; // Administradores ven todo
        }

        if ($this->hasZonalRestriction()) {
            $zonalIds = $this->getZonalIds();
            if (!empty($zonalIds)) {
                $query->whereIn($zonalColumn, $zonalIds);
            }
        }

        return $query;
    }

    /**
     * Aplicar scope completo (negocio + zonal) a una query de zonales
     */
    protected function applyZonalBusinessScope($query)
    {
        if ($this->isAdmin()) {
            return $query; // Administradores ven todo
        }

        // Filtrar por negocio primero
        if ($this->hasBusinessRestriction()) {
            $businessIds = $this->getBusinessIds();
            if (!empty($businessIds)) {
                $query->whereIn('business_id', $businessIds);
            }
        }

        // Si es supervisor, filtrar por sus zonales específicos
        if ($this->hasZonalRestriction()) {
            $zonalIds = $this->getZonalIds();
            if (!empty($zonalIds)) {
                $query->whereIn('id', $zonalIds);
            }
        }

        return $query;
    }

    /**
     * Filtrar negocios disponibles para el usuario
     */
    protected function getAvailableBusinesses()
    {
        $query = \App\Models\Business::where('status', true);

        if (!$this->isAdmin() && $this->hasBusinessRestriction()) {
            $businessIds = $this->getBusinessIds();
            if (!empty($businessIds)) {
                $query->whereIn('id', $businessIds);
            }
        }

        return $query->get(['id', 'name']);
    }

    /**
     * Filtrar zonales disponibles para el usuario
     */
    protected function getAvailableZonals()
    {
        $query = \App\Models\Zonal::where('status', true)->with('business');

        return $this->applyZonalBusinessScope($query)->get();
    }

    /**
     * Aplicar filtros de zonal usando relaciones (para PDVs, circuitos, rutas)
     */
    protected function applyZonalScopeByRelation($query, string $relationPath)
    {
        if ($this->isAdmin()) {
            return $query;
        }

        if ($this->hasZonalRestriction()) {
            $zonalIds = $this->getZonalIds();
            if (!empty($zonalIds)) {
                $query->whereHas($relationPath, function ($q) use ($zonalIds) {
                    $q->whereIn('id', $zonalIds);
                });
            }
        }

        return $query;
    }

    /**
     * Aplicar scope completo para entidades complejas como PDVs, circuitos, rutas
     */
    protected function applyFullScope($query, string $businessRelationPath, string $zonalRelationPath)
    {
        if ($this->isAdmin()) {
            return $query;
        }

        // Aplicar filtro de negocio
        if ($this->hasBusinessRestriction()) {
            $businessIds = $this->getBusinessIds();
            if (!empty($businessIds)) {
                $query->whereHas($businessRelationPath, function ($q) use ($businessIds) {
                    $q->whereIn('id', $businessIds);
                });
            }
        }

        // Aplicar filtro de zonal
        if ($this->hasZonalRestriction()) {
            $zonalIds = $this->getZonalIds();
            if (!empty($zonalIds)) {
                $query->whereHas($zonalRelationPath, function ($q) use ($zonalIds) {
                    $q->whereIn('id', $zonalIds);
                });
            }
        }

        return $query;
    }
}
