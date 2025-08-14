<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PdvFormAssignment extends Model
{
    use HasFactory;

    protected $fillable = [
        'pdv_id',
        'business_form_id',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    /**
     * Obtener el PDV al que está asignado este formulario
     */
    public function pdv(): BelongsTo
    {
        return $this->belongsTo(Pdv::class);
    }

    /**
     * Obtener el formulario asignado
     */
    public function businessForm(): BelongsTo
    {
        return $this->belongsTo(BusinessForm::class);
    }

    /**
     * Scope para asignaciones activas
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para asignaciones de un PDV específico
     */
    public function scopeByPdv($query, $pdvId)
    {
        return $query->where('pdv_id', $pdvId);
    }

    /**
     * Scope para asignaciones de un formulario específico
     */
    public function scopeByForm($query, $formId)
    {
        return $query->where('business_form_id', $formId);
    }
}
