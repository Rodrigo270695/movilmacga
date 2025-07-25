<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Route extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'circuit_id',
        'name',
        'code',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'status' => 'boolean',
    ];

    /**
     * Get the circuit that owns the route.
     */
    public function circuit(): BelongsTo
    {
        return $this->belongsTo(Circuit::class);
    }

    /**
     * Scope para obtener solo rutas activas
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope para obtener solo rutas inactivas
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInactive($query)
    {
        return $query->where('status', false);
    }

    /**
     * Scope para filtrar por circuito
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $circuitId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByCircuit($query, int $circuitId)
    {
        return $query->where('circuit_id', $circuitId);
    }

    /**
     * Scope para filtrar por zonal a través del circuito
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $zonalId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByZonal($query, int $zonalId)
    {
        return $query->whereHas('circuit', function ($circuitQuery) use ($zonalId) {
            $circuitQuery->where('zonal_id', $zonalId);
        });
    }
}
