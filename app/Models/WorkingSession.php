<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkingSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'started_at',
        'ended_at',
        'start_latitude',
        'start_longitude',
        'end_latitude',
        'end_longitude',
        'total_distance_km',
        'total_pdvs_visited',
        'total_duration_minutes',
        'status',
        'notes',
        'session_data',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'start_latitude' => 'decimal:8',
        'start_longitude' => 'decimal:8',
        'end_latitude' => 'decimal:8',
        'end_longitude' => 'decimal:8',
        'total_distance_km' => 'float',
        'total_pdvs_visited' => 'integer',
        'total_duration_minutes' => 'integer',
        'session_data' => 'array',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function pdvVisits(): HasMany
    {
        return $this->hasMany(PdvVisit::class, 'user_id', 'user_id')
                    ->whereBetween('check_in_at', [
                        $this->started_at,
                        $this->ended_at ?? now()
                    ]);
    }

    public function gpsTracking(): HasMany
    {
        return $this->hasMany(GpsTracking::class, 'user_id', 'user_id')
                    ->whereBetween('recorded_at', [
                        $this->started_at,
                        $this->ended_at ?? now()
                    ]);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeCompleted($query)
    {
        return $query->where('status', 'completed');
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeToday($query)
    {
        return $query->whereDate('started_at', today());
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('started_at', [$startDate, $endDate]);
    }

    // Mutators
    public function setEndedAtAttribute($value)
    {
        $this->attributes['ended_at'] = $value;

        // Calcular duración total automáticamente
        if ($this->started_at && $value) {
            $this->attributes['total_duration_minutes'] = $this->started_at->diffInMinutes($value);

            // Marcar como completada si no está ya
            if ($this->status === 'active') {
                $this->attributes['status'] = 'completed';
            }
        }
    }

    // Accessors
    public function getStartCoordinatesAttribute(): ?array
    {
        if (!$this->start_latitude || !$this->start_longitude) return null;
        return [$this->start_latitude, $this->start_longitude];
    }

    public function getEndCoordinatesAttribute(): ?array
    {
        if (!$this->end_latitude || !$this->end_longitude) return null;
        return [$this->end_latitude, $this->end_longitude];
    }

    public function getDurationFormattedAttribute(): string
    {
        if (!$this->total_duration_minutes) return 'Sin registrar';

        $hours = intval($this->total_duration_minutes / 60);
        $minutes = $this->total_duration_minutes % 60;

        if ($hours > 0) {
            return "{$hours}h {$minutes}m";
        }

        return "{$minutes}m";
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'active' => 'Activa',
            'paused' => 'Pausada',
            'completed' => 'Completada',
            'cancelled' => 'Cancelada',
            default => 'Desconocido'
        };
    }

    public function getIsActiveAttribute(): bool
    {
        return $this->status === 'active';
    }
}
