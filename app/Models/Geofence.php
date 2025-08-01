<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Geofence extends Model
{
    use HasFactory;

    protected $fillable = [
        'pdv_id',
        'center_latitude',
        'center_longitude',
        'radius_meters',
        'is_active',
        'trigger_type',
        'description',
        'geofence_data',
    ];

    protected $casts = [
        'center_latitude' => 'decimal:8',
        'center_longitude' => 'decimal:8',
        'radius_meters' => 'integer',
        'is_active' => 'boolean',
        'geofence_data' => 'array',
    ];

    // Relationships
    public function pdv(): BelongsTo
    {
        return $this->belongsTo(Pdv::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeByTriggerType($query, string $triggerType)
    {
        return $query->where('trigger_type', $triggerType);
    }

    public function scopeByRadius($query, int $minRadius = null, int $maxRadius = null)
    {
        if ($minRadius) {
            $query->where('radius_meters', '>=', $minRadius);
        }

        if ($maxRadius) {
            $query->where('radius_meters', '<=', $maxRadius);
        }

        return $query;
    }

    // Helper methods
    public function isPointInside(float $latitude, float $longitude): bool
    {
        if (!$this->is_active) return false;

        $distance = $this->calculateDistance($latitude, $longitude);
        return $distance <= $this->radius_meters;
    }

    public function calculateDistance(float $latitude, float $longitude): float
    {
        // Fórmula de Haversine para calcular distancia entre dos puntos GPS
        $earthRadius = 6371000; // Radio de la Tierra en metros

        $lat1Rad = deg2rad((float) $this->center_latitude);
        $lat2Rad = deg2rad($latitude);
        $deltaLatRad = deg2rad($latitude - (float) $this->center_latitude);
        $deltaLonRad = deg2rad($longitude - (float) $this->center_longitude);

        $a = sin($deltaLatRad / 2) * sin($deltaLatRad / 2) +
             cos($lat1Rad) * cos($lat2Rad) *
             sin($deltaLonRad / 2) * sin($deltaLonRad / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c; // Distancia en metros
    }

    // Accessors
    public function getCenterCoordinatesAttribute(): array
    {
        return [$this->center_latitude, $this->center_longitude];
    }

    public function getRadiusFormattedAttribute(): string
    {
        if ($this->radius_meters < 1000) {
            return $this->radius_meters . ' m';
        }

        return round($this->radius_meters / 1000, 1) . ' km';
    }

    public function getTriggerTypeLabelAttribute(): string
    {
        return match($this->trigger_type) {
            'enter' => 'Al entrar',
            'exit' => 'Al salir',
            'both' => 'Entrar y salir',
            default => 'Desconocido'
        };
    }

    // Static methods
    public static function findByCoordinates(float $latitude, float $longitude)
    {
        return static::active()->get()->filter(function ($geofence) use ($latitude, $longitude) {
            return $geofence->isPointInside($latitude, $longitude);
        });
    }
}
