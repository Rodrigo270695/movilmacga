<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GpsTracking extends Model
{
    use HasFactory;

    protected $table = 'gps_tracking';

    protected $fillable = [
        'user_id',
        'latitude',
        'longitude',
        'accuracy',
        'speed',
        'heading',
        'battery_level',
        'is_mock_location',
        'recorded_at',
    ];

    protected $casts = [
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'accuracy' => 'float',
        'speed' => 'float',
        'heading' => 'float',
        'battery_level' => 'integer',
        'is_mock_location' => 'boolean',
        'recorded_at' => 'datetime',
    ];

    // Relationships
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeRecent($query, int $minutes = 5)
    {
        return $query->where('recorded_at', '>=', now()->subMinutes($minutes));
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeValidLocation($query)
    {
        return $query->whereNotNull('latitude')
                    ->whereNotNull('longitude')
                    ->where('is_mock_location', false);
    }

    public function scopeByDateRange($query, $startDate, $endDate)
    {
        return $query->whereBetween('recorded_at', [$startDate, $endDate]);
    }

    // Accessors
    public function getCoordinatesAttribute(): array
    {
        return [$this->latitude, $this->longitude];
    }

    public function getLocationAccuracyAttribute(): string
    {
        if (!$this->accuracy) return 'Desconocida';

        if ($this->accuracy <= 5) return 'Excelente';
        if ($this->accuracy <= 20) return 'Buena';
        if ($this->accuracy <= 50) return 'Regular';
        return 'Baja';
    }
}
