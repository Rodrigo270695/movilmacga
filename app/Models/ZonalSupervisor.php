<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class ZonalSupervisor extends Model
{
    use HasFactory;

    protected $table = 'zonal_supervisors';

    protected $fillable = [
        'zonal_id',
        'user_id',
        'assigned_at',
        'is_active',
        'notes',
        'assignment_data',
    ];

    protected $casts = [
        'assigned_at' => 'datetime',
        'is_active' => 'boolean',
        'assignment_data' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con el zonal
     */
    public function zonal(): BelongsTo
    {
        return $this->belongsTo(Zonal::class);
    }

    /**
     * Relación con el supervisor (usuario)
     */
    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope para asignaciones activas
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para asignaciones inactivas
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Scope para buscar por supervisor
     */
    public function scopeBySupervisor(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope para buscar por zonal
     */
    public function scopeByZonal(Builder $query, int $zonalId): Builder
    {
        return $query->where('zonal_id', $zonalId);
    }
}