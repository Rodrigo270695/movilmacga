<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Departamento extends Model
{
    use HasFactory;

    protected $fillable = [
        'pais_id',
        'name',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    // Relationships
    public function pais(): BelongsTo
    {
        return $this->belongsTo(Pais::class);
    }

    public function provincias(): HasMany
    {
        return $this->hasMany(Provincia::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
