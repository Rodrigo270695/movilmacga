<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Pais extends Model
{
    use HasFactory;

    protected $table = 'paises';

    protected $fillable = [
        'name',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    // Relationships
    public function departamentos(): HasMany
    {
        return $this->hasMany(Departamento::class);
    }

    public function activeDepartamentos(): HasMany
    {
        return $this->hasMany(Departamento::class)->where('status', true);
    }

    // Relationships through hierarchy
    public function provincias(): HasManyThrough
    {
        return $this->hasManyThrough(Provincia::class, Departamento::class);
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

    public function scopeWithDepartamentosCount($query)
    {
        return $query->withCount(['departamentos', 'activeDepartamentos']);
    }

    public function scopeWithFullHierarchyCount($query)
    {
        return $query->withCount([
            'departamentos',
            'activeDepartamentos',
            'provincias'
        ]);
    }
}
