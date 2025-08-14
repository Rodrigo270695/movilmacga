<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PdvVisitFormResponse extends Model
{
    use HasFactory;

    protected $fillable = [
        'pdv_visit_id',
        'form_field_id',
        'response_value',
        'response_file',
        'response_location',
        'response_signature',
        'response_metadata',
    ];

    protected $casts = [
        'response_location' => 'array',
        'response_metadata' => 'array',
    ];

    /**
     * Obtener la visita a la que pertenece esta respuesta
     */
    public function pdvVisit(): BelongsTo
    {
        return $this->belongsTo(PdvVisit::class);
    }

    /**
     * Obtener el campo del formulario al que corresponde esta respuesta
     */
    public function formField(): BelongsTo
    {
        return $this->belongsTo(FormField::class);
    }

    /**
     * Obtener el PDV a través de la visita
     */
    public function pdv(): BelongsTo
    {
        return $this->belongsTo(Pdv::class, 'pdv_id', 'id')
            ->join('pdv_visits', 'pdv_visits.pdv_id', '=', 'pdvs.id')
            ->where('pdv_visits.id', $this->pdv_visit_id);
    }

    /**
     * Obtener el usuario (vendedor) a través de la visita
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id')
            ->join('pdv_visits', 'pdv_visits.user_id', '=', 'users.id')
            ->where('pdv_visits.id', $this->pdv_visit_id);
    }

    /**
     * Scope para respuestas de una visita específica
     */
    public function scopeByVisit($query, $visitId)
    {
        return $query->where('pdv_visit_id', $visitId);
    }

    /**
     * Scope para respuestas de un campo específico
     */
    public function scopeByField($query, $fieldId)
    {
        return $query->where('form_field_id', $fieldId);
    }

    /**
     * Scope para respuestas con archivos
     */
    public function scopeWithFiles($query)
    {
        return $query->whereNotNull('response_file');
    }

    /**
     * Scope para respuestas con ubicación
     */
    public function scopeWithLocation($query)
    {
        return $query->whereNotNull('response_location');
    }

    /**
     * Scope para respuestas con firma
     */
    public function scopeWithSignature($query)
    {
        return $query->whereNotNull('response_signature');
    }

    /**
     * Obtener el valor de la respuesta según el tipo de campo
     */
    public function getResponseValue()
    {
        $field = $this->formField;

        if (!$field) {
            return $this->response_value;
        }

        switch ($field->field_type) {
            case 'image':
            case 'pdf':
            case 'video':
            case 'audio':
                return $this->response_file;

            case 'location':
                return $this->response_location;

            case 'signature':
                return $this->response_signature;

            case 'checkbox':
            case 'multiselect':
                return $this->response_value ? json_decode($this->response_value, true) : [];

            case 'number':
                return $this->response_value ? (float) $this->response_value : null;

            default:
                return $this->response_value;
        }
    }

    /**
     * Verificar si la respuesta tiene un archivo
     */
    public function hasFile(): bool
    {
        return !empty($this->response_file);
    }

    /**
     * Verificar si la respuesta tiene ubicación
     */
    public function hasLocation(): bool
    {
        return !empty($this->response_location);
    }

    /**
     * Verificar si la respuesta tiene firma
     */
    public function hasSignature(): bool
    {
        return !empty($this->response_signature);
    }

    /**
     * Obtener la URL del archivo (si existe)
     */
    public function getFileUrl(): ?string
    {
        if (!$this->hasFile()) {
            return null;
        }

        return asset('storage/' . $this->response_file);
    }

    /**
     * Obtener las coordenadas de ubicación
     */
    public function getLocationCoordinates(): ?array
    {
        if (!$this->hasLocation()) {
            return null;
        }

        return [
            'lat' => $this->response_location['lat'] ?? null,
            'lng' => $this->response_location['lng'] ?? null,
            'accuracy' => $this->response_location['accuracy'] ?? null,
        ];
    }

    /**
     * Obtener el valor formateado para mostrar
     */
    public function getFormattedValue(): string
    {
        $field = $this->formField;

        if (!$field) {
            return $this->response_value ?? 'Sin respuesta';
        }

        switch ($field->field_type) {
            case 'select':
            case 'radio':
                $options = $field->getOptionsArray();
                return $options[$this->response_value] ?? $this->response_value ?? 'Sin respuesta';

            case 'checkbox':
            case 'multiselect':
                $values = $this->response_value ? json_decode($this->response_value, true) : [];
                $options = $field->getOptionsArray();
                $selected = [];
                foreach ($values as $value) {
                    $selected[] = $options[$value] ?? $value;
                }
                return !empty($selected) ? implode(', ', $selected) : 'Sin respuesta';

            case 'image':
                return $this->hasFile() ? 'Imagen subida' : 'Sin imagen';

            case 'pdf':
                return $this->hasFile() ? 'PDF subido' : 'Sin PDF';

            case 'location':
                return $this->hasLocation() ? 'Ubicación registrada' : 'Sin ubicación';

            case 'signature':
                return $this->hasSignature() ? 'Firma registrada' : 'Sin firma';

            default:
                return $this->response_value ?? 'Sin respuesta';
        }
    }
}
