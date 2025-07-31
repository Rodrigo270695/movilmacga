<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
