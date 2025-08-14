<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RouteVisitDate extends Model
{
    use HasFactory;

    protected $fillable = [
        'route_id',
        'visit_date',
        'is_active',
        'notes',
    ];

    protected $casts = [
        'visit_date' => 'date',
        'is_active' => 'boolean',
    ];

    /**
     * Obtiene la ruta a la que pertenece esta fecha de visita.
     */
    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    /**
     * Scope para filtrar por fechas activas.
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para filtrar por ruta.
     */
    public function scopeForRoute($query, $routeId)
    {
        return $query->where('route_id', $routeId);
    }

    /**
     * Scope para filtrar por rango de fechas.
     */
    public function scopeDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('visit_date', [$startDate, $endDate]);
    }

    /**
     * Scope para filtrar por año.
     */
    public function scopeForYear($query, $year)
    {
        return $query->whereYear('visit_date', $year);
    }

    /**
     * Scope para filtrar por mes.
     */
    public function scopeForMonth($query, $year, $month)
    {
        return $query->whereYear('visit_date', $year)
                    ->whereMonth('visit_date', $month);
    }

    /**
     * Obtiene el día de la semana de la fecha de visita.
     */
    public function getDayOfWeekAttribute(): string
    {
        return $this->visit_date->format('l'); // Monday, Tuesday, etc.
    }

    /**
     * Obtiene el día de la semana en español.
     */
    public function getDayOfWeekSpanishAttribute(): string
    {
        $days = [
            'Monday' => 'Lunes',
            'Tuesday' => 'Martes',
            'Wednesday' => 'Miércoles',
            'Thursday' => 'Jueves',
            'Friday' => 'Viernes',
            'Saturday' => 'Sábado',
            'Sunday' => 'Domingo',
        ];

        return $days[$this->day_of_week] ?? $this->day_of_week;
    }

    /**
     * Obtiene la fecha formateada para mostrar.
     */
    public function getFormattedDateAttribute(): string
    {
        return $this->visit_date->format('d/m/Y');
    }

    /**
     * Obtiene la fecha formateada con el día de la semana.
     */
    public function getFormattedDateWithDayAttribute(): string
    {
        return $this->visit_date->format('d/m/Y') . ' (' . $this->day_of_week_spanish . ')';
    }
}
