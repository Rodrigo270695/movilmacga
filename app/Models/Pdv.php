<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Pdv extends Model
{
    use HasFactory;

    protected $fillable = [
        'point_name',
        'pos_id',
        'document_type',
        'document_number',
        'client_name',
        'email',
        'phone',
        'sells_recharge',
        'classification',
        'status',
        'address',
        'reference',
        'latitude',
        'longitude',
        'route_id',
        'locality_id',
        'district_id',
        'locality',
    ];

    protected $casts = [
        'sells_recharge' => 'boolean',
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
    ];

    // Relationships
    public function route(): BelongsTo
    {
        return $this->belongsTo(Route::class);
    }

    public function locality(): BelongsTo
    {
        return $this->belongsTo(Localidad::class);
    }

    public function district(): BelongsTo
    {
        return $this->belongsTo(Distrito::class);
    }

    public function pdvVisits(): HasMany
    {
        return $this->hasMany(PdvVisit::class);
    }

    /**
     * Get form assignments for this PDV
     */
    public function formAssignments(): HasMany
    {
        return $this->hasMany(PdvFormAssignment::class);
    }

    /**
     * Get active form assignments for this PDV
     */
    public function activeFormAssignments(): HasMany
    {
        return $this->hasMany(PdvFormAssignment::class)->where('is_active', true);
    }

    /**
     * Get the assigned form for this PDV
     */
    public function assignedForm(): BelongsTo
    {
        return $this->belongsTo(BusinessForm::class, 'business_form_id', 'id')
            ->join('pdv_form_assignments', 'pdv_form_assignments.business_form_id', '=', 'business_forms.id')
            ->where('pdv_form_assignments.pdv_id', $this->id)
            ->where('pdv_form_assignments.is_active', true);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'vende');
    }

    public function scopeBySellsRecharge($query, bool $sellsRecharge = true)
    {
        return $query->where('sells_recharge', $sellsRecharge);
    }

    public function scopeByClassification($query, string $classification)
    {
        return $query->where('classification', $classification);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByRoute($query, int $routeId)
    {
        return $query->where('route_id', $routeId);
    }

    public function scopeByLocality($query, int $localityId)
    {
        return $query->where('locality_id', $localityId);
    }

    public function scopeByDistrict($query, int $districtId)
    {
        return $query->where('district_id', $districtId);
    }

    public function scopeByLocalityText($query, string $locality)
    {
        return $query->where('locality', 'like', "%{$locality}%");
    }

    public function scopeWithCoordinates($query)
    {
        return $query->whereNotNull('latitude')->whereNotNull('longitude');
    }

    // Accessors
    public function getFullAddressAttribute(): string
    {
        return $this->reference ? "{$this->address} - {$this->reference}" : $this->address;
    }

    public function getClassificationLabelAttribute(): string
    {
        return match($this->classification) {
            'telecomunicaciones' => 'Telecomunicaciones',
            'chalequeros' => 'Chalequeros',
            'bodega' => 'Bodega',
            'otras tiendas' => 'Otras Tiendas',
            'desconocida' => 'Desconocida',
            'pusher' => 'Pusher',
            default => 'Desconocida'
        };
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'vende' => 'Vende',
            'no vende' => 'No Vende',
            'no existe' => 'No Existe',
            'pdv autoactivado' => 'PDV Autoactivado',
            'pdv impulsador' => 'PDV Impulsador',
            default => 'No Vende'
        };
    }

    public function getDocumentTypeFullAttribute(): string
    {
        return $this->document_type === 'DNI' ? 'DNI' : 'RUC';
    }
}
