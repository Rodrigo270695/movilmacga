<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FormField extends Model
{
    use HasFactory;

    // Tipos de campos disponibles
    const FIELD_TYPES = [
        'text' => 'Texto',
        'textarea' => 'Texto largo',
        'number' => 'Número',
        'email' => 'Email',
        'phone' => 'Teléfono',
        'select' => 'Lista desplegable',
        'radio' => 'Botones de opción',
        'checkbox' => 'Casillas de verificación',
        'multiselect' => 'Selección múltiple',
        'image' => 'Imagen',
        'pdf' => 'Documento PDF',
        'video' => 'Video',
        'audio' => 'Audio',
        'location' => 'Ubicación GPS',
        'signature' => 'Firma digital',
        'barcode' => 'Código de barras',
        'date' => 'Fecha',
        'time' => 'Hora',
        'datetime' => 'Fecha y hora',
    ];

    protected $fillable = [
        'form_section_id',
        'field_type',
        'label',
        'placeholder',
        'is_required',
        'validation_rules',
        'options',
        'order_index',
        'min_value',
        'max_value',
        'file_types',
        'max_file_size',
        'is_active',
        'settings',
    ];

    protected $casts = [
        'is_required' => 'boolean',
        'is_active' => 'boolean',
        'validation_rules' => 'array',
        'options' => 'array',
        'settings' => 'array',
        'min_value' => 'decimal:2',
        'max_value' => 'decimal:2',
    ];

    /**
     * Obtener la sección a la que pertenece este campo
     */
    public function section(): BelongsTo
    {
        return $this->belongsTo(FormSection::class, 'form_section_id');
    }

    /**
     * Obtener el formulario al que pertenece este campo
     */
    public function businessForm(): BelongsTo
    {
        return $this->belongsTo(BusinessForm::class, 'business_form_id', 'id')
            ->join('form_sections', 'form_sections.business_form_id', '=', 'business_forms.id')
            ->where('form_sections.id', $this->form_section_id);
    }

    /**
     * Obtener las respuestas de este campo
     */
    public function responses(): HasMany
    {
        return $this->hasMany(PdvVisitFormResponse::class);
    }

    /**
     * Scope para campos activos
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope para campos de una sección específica
     */
    public function scopeBySection($query, $sectionId)
    {
        return $query->where('form_section_id', $sectionId);
    }

    /**
     * Scope para ordenar por índice
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('order_index');
    }

    /**
     * Scope para campos requeridos
     */
    public function scopeRequired($query)
    {
        return $query->where('is_required', true);
    }

    /**
     * Scope para un tipo de campo específico
     */
    public function scopeByType($query, $type)
    {
        return $query->where('field_type', $type);
    }

    /**
     * Verificar si el campo es de tipo archivo
     */
    public function isFileType(): bool
    {
        return in_array($this->field_type, ['image', 'pdf', 'video', 'audio']);
    }

    /**
     * Verificar si el campo es de tipo selección
     */
    public function isSelectionType(): bool
    {
        return in_array($this->field_type, ['select', 'radio', 'checkbox', 'multiselect']);
    }

    /**
     * Verificar si el campo es de tipo numérico
     */
    public function isNumericType(): bool
    {
        return in_array($this->field_type, ['number']);
    }

    /**
     * Verificar si el campo es de tipo texto
     */
    public function isTextType(): bool
    {
        return in_array($this->field_type, ['text', 'textarea', 'email', 'phone']);
    }

    /**
     * Obtener los tipos de archivo permitidos como array
     */
    public function getAllowedFileTypes(): array
    {
        if (!$this->file_types) {
            return [];
        }
        return explode(',', $this->file_types);
    }

    /**
     * Verificar si un tipo de archivo está permitido
     */
    public function isFileTypeAllowed(string $fileType): bool
    {
        $allowedTypes = $this->getAllowedFileTypes();
        return in_array(strtolower($fileType), array_map('strtolower', $allowedTypes));
    }

    /**
     * Obtener el tamaño máximo de archivo en bytes
     */
    public function getMaxFileSizeInBytes(): int
    {
        return $this->max_file_size ? $this->max_file_size * 1024 : 0;
    }

    /**
     * Obtener las reglas de validación para Laravel
     */
    public function getValidationRules(): array
    {
        $rules = [];

        if ($this->is_required) {
            $rules[] = 'required';
        } else {
            $rules[] = 'nullable';
        }

        // Reglas específicas por tipo de campo
        switch ($this->field_type) {
            case 'email':
                $rules[] = 'email';
                break;
            case 'number':
                $rules[] = 'numeric';
                if ($this->min_value !== null) {
                    $rules[] = "min:{$this->min_value}";
                }
                if ($this->max_value !== null) {
                    $rules[] = "max:{$this->max_value}";
                }
                break;
            case 'image':
                $rules[] = 'image';
                if ($this->file_types) {
                    $rules[] = 'mimes:' . str_replace(',', ',', $this->file_types);
                }
                if ($this->max_file_size) {
                    $rules[] = "max:{$this->max_file_size}";
                }
                break;
            case 'pdf':
                $rules[] = 'mimes:pdf';
                if ($this->max_file_size) {
                    $rules[] = "max:{$this->max_file_size}";
                }
                break;
            case 'select':
            case 'radio':
                if ($this->options) {
                    $rules[] = 'in:' . implode(',', array_keys($this->options));
                }
                break;
        }

        // Agregar reglas personalizadas si existen
        if ($this->validation_rules) {
            $rules = array_merge($rules, $this->validation_rules);
        }

        return $rules;
    }

    /**
     * Obtener el nombre del tipo de campo
     */
    public function getFieldTypeName(): string
    {
        return self::FIELD_TYPES[$this->field_type] ?? $this->field_type;
    }

    /**
     * Obtener las opciones como array para selects/checkboxes
     */
    public function getOptionsArray(): array
    {
        return $this->options ?? [];
    }
}
