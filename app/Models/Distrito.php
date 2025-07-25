<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Distrito extends Model
{
    use HasFactory;

    protected $fillable = [
        'provincia_id',
        'name',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    // Relationships
    public function provincia(): BelongsTo
    {
        return $this->belongsTo(Provincia::class);
    }

    // Access departamento through provincia relationship
    public function getDepartamentoAttribute()
    {
        return $this->provincia->departamento;
    }

    // Access pais through hierarchy
    public function getPaisAttribute()
    {
        return $this->provincia->departamento->pais;
    }

    public function localidades(): HasMany
    {
        return $this->hasMany(Localidad::class);
    }

    public function activeLocalidades(): HasMany
    {
        return $this->hasMany(Localidad::class)->where('status', true);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('status', false);
    }

    public function scopeByProvincia($query, int $provinciaId)
    {
        return $query->where('provincia_id', $provinciaId);
    }

    public function scopeByDepartamento($query, int $departamentoId)
    {
        return $query->whereHas('provincia', function ($q) use ($departamentoId) {
            $q->where('departamento_id', $departamentoId);
        });
    }

    public function scopeByPais($query, int $paisId)
    {
        return $query->whereHas('provincia.departamento', function ($q) use ($paisId) {
            $q->where('pais_id', $paisId);
        });
    }

    public function scopeWithLocalidadesCount($query)
    {
        return $query->withCount(['localidades', 'activeLocalidades']);
    }
}
