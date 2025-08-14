<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_form_id',
        'name',
        'description',
        'order_index',
        'is_required',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    /**
     * Obtener el formulario al que pertenece esta sección
     */
    public function businessForm(): BelongsTo
    {
        return $this->belongsTo(BusinessForm::class);
    }

    /**
     * Obtener los campos de esta sección
     */
    public function fields(): HasMany
    {
        return $this->hasMany(FormField::class)->orderBy('order_index');
    }

    /**
     * Obtener los campos activos de esta sección
     */
    public function activeFields(): HasMany
    {
        return $this->hasMany(FormField::class)
            ->where('is_active', true)
            ->orderBy('order_index');
    }

    /**
     * Scope para secciones activas
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para secciones de un formulario específico
     */
    public function scopeByForm($query, $formId)
    {
        return $query->where('business_form_id', $formId);
    }

    /**
     * Scope para ordenar por índice
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_index');
    }

    /**
     * Obtener el número de campos en esta sección
     */
    public function getFieldsCount(): int
    {
        return $this->activeFields()->count();
    }

    /**
     * Obtener el número de campos requeridos en esta sección
     */
    public function getRequiredFieldsCount(): int
    {
        return $this->activeFields()->where('is_required', true)->count();
    }

    /**
     * Verificar si la sección tiene campos requeridos
     */
    public function hasRequiredFields(): bool
    {
        return $this->activeFields()->where('is_required', true)->exists();
    }
}
