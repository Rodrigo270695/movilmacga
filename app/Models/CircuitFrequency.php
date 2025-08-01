<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CircuitFrequency extends Model
{
    use HasFactory;

    protected $fillable = [
        'circuit_id',
        'day_of_week',
    ];

    protected $casts = [
        'circuit_id' => 'integer',
    ];

    /**
     * Relación con el circuito
     */
    public function circuit(): BelongsTo
    {
        return $this->belongsTo(Circuit::class);
    }

    /**
     * Scope para obtener frecuencias por circuito
     */
    public function scopeByCircuit($query, int $circuitId)
    {
        return $query->where('circuit_id', $circuitId);
    }

    /**
     * Scope para obtener frecuencias por día
     */
    public function scopeByDay($query, string $dayOfWeek)
    {
        return $query->where('day_of_week', $dayOfWeek);
    }

    /**
     * Obtener el nombre del día en español
     */
    public function getDayNameAttribute(): string
    {
        $days = [
            'monday' => 'Lunes',
            'tuesday' => 'Martes',
            'wednesday' => 'Miércoles',
            'thursday' => 'Jueves',
            'friday' => 'Viernes',
            'saturday' => 'Sábado',
            'sunday' => 'Domingo',
        ];

        return $days[$this->day_of_week] ?? $this->day_of_week;
    }

    /**
     * Obtener todos los días de la semana disponibles
     */
    public static function getAvailableDays(): array
    {
        return [
            'monday' => 'Lunes',
            'tuesday' => 'Martes',
            'wednesday' => 'Miércoles',
            'thursday' => 'Jueves',
            'friday' => 'Viernes',
            'saturday' => 'Sábado',
            'sunday' => 'Domingo',
        ];
    }
}
