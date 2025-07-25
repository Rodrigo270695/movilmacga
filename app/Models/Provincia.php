<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provincia extends Model
{
    use HasFactory;

    protected $fillable = [
        'departamento_id',
        'name',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    // Relationships
    public function departamento(): BelongsTo
    {
        return $this->belongsTo(Departamento::class);
    }

    // Access pais through departamento relationship
    public function getPaisAttribute()
    {
        return $this->departamento->pais;
    }

    public function distritos(): HasMany
    {
        return $this->hasMany(Distrito::class);
    }

    public function activeDistritos(): HasMany
    {
        return $this->hasMany(Distrito::class)->where('status', true);
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

    public function scopeByDepartamento($query, int $departamentoId)
    {
        return $query->where('departamento_id', $departamentoId);
    }

    public function scopeByPais($query, int $paisId)
    {
        return $query->whereHas('departamento', function ($q) use ($paisId) {
            $q->where('pais_id', $paisId);
        });
    }

    public function scopeWithDistritosCount($query)
    {
        return $query->withCount(['distritos', 'activeDistritos']);
    }
}
