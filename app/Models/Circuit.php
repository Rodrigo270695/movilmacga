<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Circuit extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'zonal_id',
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
     * Get the zonal that owns the circuit.
     */
    public function zonal(): BelongsTo
    {
        return $this->belongsTo(Zonal::class);
    }

    /**
     * Scope para obtener solo circuitos activos
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope para obtener solo circuitos inactivos
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInactive($query)
    {
        return $query->where('status', false);
    }

    /**
     * Scope para filtrar por zonal
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $zonalId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByZonal($query, int $zonalId)
    {
        return $query->where('zonal_id', $zonalId);
    }

    /**
     * Get the routes for the circuit.
     */
    public function routes(): HasMany
    {
        return $this->hasMany(Route::class);
    }

    /**
     * Get only active routes for the circuit.
     */
    public function activeRoutes(): HasMany
    {
        return $this->hasMany(Route::class)->where('status', true);
    }

    /**
     * Get all circuit supervisor assignments.
     */
    public function circuitSupervisors(): HasMany
    {
        return $this->hasMany(CircuitSupervisor::class);
    }

    /**
     * Get the active circuit supervisor assignment.
     */
    public function activeCircuitSupervisor()
    {
        return $this->hasOne(CircuitSupervisor::class)->where('is_active', true);
    }

    /**
     * Get the currently assigned supervisor (if any).
     */
    public function supervisor()
    {
        return $this->hasOneThrough(
            User::class,
            CircuitSupervisor::class,
            'circuit_id', // Foreign key on CircuitSupervisor table
            'id',         // Foreign key on User table
            'id',         // Local key on Circuit table
            'user_id'     // Local key on CircuitSupervisor table
        )->where('circuit_supervisors.is_active', true);
    }

    /**
     * Get all user assignments for this circuit.
     */
    public function userCircuits(): HasMany
    {
        return $this->hasMany(UserCircuit::class);
    }

    /**
     * Get active user assignments for this circuit.
     */
    public function activeUserCircuits(): HasMany
    {
        return $this->hasMany(UserCircuit::class)->where('is_active', true);
    }

    /**
     * Get all frequency assignments for this circuit.
     */
    public function frequencies(): HasMany
    {
        return $this->hasMany(CircuitFrequency::class);
    }

    /**
     * Get the frequency days as an array of strings.
     */
    public function getFrequencyDaysAttribute(): array
    {
        return $this->frequencies()->pluck('day_of_week')->toArray();
    }
}
