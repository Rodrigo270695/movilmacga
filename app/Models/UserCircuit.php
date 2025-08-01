<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class UserCircuit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'circuit_id',
        'assigned_date',
        'is_active',
        'priority',
        'notes',
        'assignment_data',
        'valid_from',
        'valid_until',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'is_active' => 'boolean',
        'priority' => 'integer',
        'assignment_data' => 'array',
        'valid_from' => 'date',
        'valid_until' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con el usuario (vendedor)
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con el circuito
     */
    public function circuit(): BelongsTo
    {
        return $this->belongsTo(Circuit::class);
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
     * Scope para buscar por usuario
     */
    public function scopeByUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope para buscar por circuito
     */
    public function scopeByCircuit(Builder $query, int $circuitId): Builder
    {
        return $query->where('circuit_id', $circuitId);
    }

    /**
     * Scope para asignaciones válidas en una fecha específica
     */
    public function scopeValid(Builder $query, $date = null): Builder
    {
        $checkDate = $date ?? today();

        return $query->where('valid_from', '<=', $checkDate)
                    ->where(function($q) use ($checkDate) {
                        $q->whereNull('valid_until')
                          ->orWhere('valid_until', '>=', $checkDate);
                    });
    }

    /**
     * Scope por prioridad
     */
    public function scopeByPriority(Builder $query, int $priority): Builder
    {
        return $query->where('priority', $priority);
    }

    /**
     * Scope para alta prioridad
     */
    public function scopeHighPriority(Builder $query): Builder
    {
        return $query->where('priority', '<=', 2);
    }

    /**
     * Accessor para etiqueta de prioridad
     */
    public function getPriorityLabelAttribute(): string
    {
        return match($this->priority) {
            1 => 'Muy Alta',
            2 => 'Alta',
            3 => 'Media',
            4 => 'Baja',
            5 => 'Muy Baja',
            default => 'Sin definir'
        };
    }
}
