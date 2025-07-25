<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Localidad extends Model
{
    use HasFactory;

    protected $table = 'localidades';

    protected $fillable = [
        'distrito_id',
        'name',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    // Relationships
    public function distrito(): BelongsTo
    {
        return $this->belongsTo(Distrito::class);
    }

    // Access provincia through distrito relationship
    public function getProvinciaAttribute()
    {
        return $this->distrito->provincia;
    }

    // Access departamento through hierarchy
    public function getDepartamentoAttribute()
    {
        return $this->distrito->provincia->departamento;
    }

    // Access pais through hierarchy
    public function getPaisAttribute()
    {
        return $this->distrito->provincia->departamento->pais;
    }

    public function pdvs(): HasMany
    {
        return $this->hasMany(Pdv::class);
    }

    public function activePdvs(): HasMany
    {
        return $this->hasMany(Pdv::class)->where('status', 'vende');
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

    public function scopeByDistrito($query, int $distritoId)
    {
        return $query->where('distrito_id', $distritoId);
    }

    public function scopeByProvincia($query, int $provinciaId)
    {
        return $query->whereHas('distrito', function ($q) use ($provinciaId) {
            $q->where('provincia_id', $provinciaId);
        });
    }

    public function scopeByDepartamento($query, int $departamentoId)
    {
        return $query->whereHas('distrito.provincia', function ($q) use ($departamentoId) {
            $q->where('departamento_id', $departamentoId);
        });
    }

    public function scopeByPais($query, int $paisId)
    {
        return $query->whereHas('distrito.provincia.departamento', function ($q) use ($paisId) {
            $q->where('pais_id', $paisId);
        });
    }

    public function scopeWithPdvsCount($query)
    {
        return $query->withCount(['pdvs', 'activePdvs']);
    }

    // Accessors
    public function getFullLocationAttribute(): string
    {
        return "{$this->name}, {$this->distrito->name}, {$this->provincia->name}, {$this->departamento->name}, {$this->pais->name}";
    }
}
