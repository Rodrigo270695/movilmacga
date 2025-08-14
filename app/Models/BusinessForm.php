<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class BusinessForm extends Model
{
    use HasFactory;

    protected $fillable = [
        'business_id',
        'name',
        'description',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'settings' => 'array',
    ];

    /**
     * Obtener el negocio al que pertenece este formulario
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * Obtener las secciones del formulario
     */
    public function sections(): HasMany
    {
        return $this->hasMany(FormSection::class)->orderBy('order_index');
    }

    /**
     * Obtener las secciones activas del formulario
     */
    public function activeSections(): HasMany
    {
        return $this->hasMany(FormSection::class)
            ->where('is_active', true)
            ->orderBy('order_index');
    }

    /**
     * Obtener todos los campos del formulario a través de las secciones
     */
    public function fields(): HasManyThrough
    {
        return $this->hasManyThrough(
            FormField::class,
            FormSection::class,
            'business_form_id', // Clave foránea en form_sections
            'form_section_id', // Clave foránea en form_fields
            'id', // Clave local en business_forms
            'id' // Clave local en form_sections
        );
    }

    /**
     * Obtener todos los campos activos del formulario
     */
    public function activeFields(): HasManyThrough
    {
        return $this->hasManyThrough(
            FormField::class,
            FormSection::class,
            'business_form_id',
            'form_section_id',
            'id',
            'id'
        )->where('form_fields.is_active', true)
         ->where('form_sections.is_active', true)
         ->orderBy('form_sections.order_index')
         ->orderBy('form_fields.order_index');
    }

    /**
     * Obtener las asignaciones de PDVs a este formulario
     */
    public function pdvAssignments(): HasMany
    {
        return $this->hasMany(PdvFormAssignment::class);
    }

    /**
     * Obtener las asignaciones activas de PDVs
     */
    public function activePdvAssignments(): HasMany
    {
        return $this->hasMany(PdvFormAssignment::class)
            ->where('is_active', true);
    }

    /**
     * Obtener los PDVs que tienen este formulario asignado
     */
    public function assignedPdvs(): HasManyThrough
    {
        return $this->hasManyThrough(
            Pdv::class,
            PdvFormAssignment::class,
            'business_form_id',
            'id',
            'id',
            'pdv_id'
        )->where('pdv_form_assignments.is_active', true);
    }

    /**
     * Scope para formularios activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para formularios de un negocio específico
     */
    public function scopeByBusiness($query, $businessId)
    {
        return $query->where('business_id', $businessId);
    }

    /**
     * Obtener la estructura completa del formulario para la APK
     */
    public function getFormStructure(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'description' => $this->description,
            'business_id' => $this->business_id,
            'business_name' => $this->business->name,
            'sections' => $this->activeSections->map(function ($section) {
                return [
                    'id' => $section->id,
                    'name' => $section->name,
                    'description' => $section->description,
                    'order_index' => $section->order_index,
                    'is_required' => $section->is_required,
                    'fields' => $section->activeFields->map(function ($field) {
                        return [
                            'id' => $field->id,
                            'type' => $field->field_type,
                            'label' => $field->label,
                            'placeholder' => $field->placeholder,
                            'is_required' => $field->is_required,
                            'validation_rules' => $field->validation_rules,
                            'options' => $field->options,
                            'order_index' => $field->order_index,
                            'min_value' => $field->min_value,
                            'max_value' => $field->max_value,
                            'file_types' => $field->file_types,
                            'max_file_size' => $field->max_file_size,
                            'settings' => $field->settings,
                        ];
                    })->toArray(),
                ];
            })->toArray(),
        ];
    }

    /**
     * Verificar si el formulario tiene campos requeridos
     */
    public function hasRequiredFields(): bool
    {
        return $this->activeFields()->where('is_required', true)->exists();
    }

    /**
     * Obtener el número total de campos del formulario
     */
    public function getTotalFieldsCount(): int
    {
        return $this->activeFields()->count();
    }

    /**
     * Obtener el número de campos requeridos
     */
    public function getRequiredFieldsCount(): int
    {
        return $this->activeFields()->where('is_required', true)->count();
    }
}
