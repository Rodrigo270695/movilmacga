<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PdvVisit extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pdv_id',
        'check_in_at',
        'check_out_at',
        'latitude',
        'longitude',
        'distance_to_pdv',
        'visit_photo',
        'notes',
        'visit_data',
        'is_valid',
        'duration_minutes',
        'visit_status',
    ];

    protected $casts = [
        'check_in_at' => 'datetime',
        'check_out_at' => 'datetime',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'distance_to_pdv' => 'float',
        'visit_data' => 'array',
        'is_valid' => 'boolean',
        'duration_minutes' => 'integer',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pdv(): BelongsTo
    {
        return $this->belongsTo(Pdv::class);
    }

    /**
     * Get form responses for this visit
     */
    public function formResponses(): HasMany
    {
        return $this->hasMany(PdvVisitFormResponse::class);
    }

    /**
     * Get form responses with field information
     */
    public function formResponsesWithFields(): HasMany
    {
        return $this->hasMany(PdvVisitFormResponse::class)->with('formField');
    }

    // Scopes
    public function scopeCompleted($query)
    {
        return $query->where('visit_status', 'completed');
    }

    public function scopeInProgress($query)
    {
        return $query->where('visit_status', 'in_progress');
    }

    public function scopeValid($query)
    {
        return $query->where('is_valid', true);
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByPdv($query, int $pdvId)
    {
        return $query->where('pdv_id', $pdvId);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('check_in_at', today());
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('check_in_at', [$startDate, $endDate]);
    }

    // Mutators
    public function setCheckOutAtAttribute($value)
    {
        $this->attributes['check_out_at'] = $value;

        // Calcular duración automáticamente si hay check_in y check_out
        if ($this->check_in_at && $value) {
            $this->attributes['duration_minutes'] = $this->check_in_at->diffInMinutes($value);

            // Marcar como completada si no está ya
            if ($this->visit_status === 'in_progress') {
                $this->attributes['visit_status'] = 'completed';
            }
        }
    }

    // Accessors
    public function getCoordinatesAttribute(): array
    {
        return [$this->latitude, $this->longitude];
    }

    public function getDurationFormattedAttribute(): string
    {
        if (!$this->duration_minutes) return 'Sin registrar';

        $hours = intval($this->duration_minutes / 60);
        $minutes = $this->duration_minutes % 60;

        if ($hours > 0) {
            return "{$hours}h {$minutes}m";
        }

        return "{$minutes}m";
    }

    public function getVisitStatusLabelAttribute(): string
    {
        return match($this->visit_status) {
            'in_progress' => 'En progreso',
            'completed' => 'Completada',
            'cancelled' => 'Cancelada',
            default => 'Desconocido'
        };
    }
}
