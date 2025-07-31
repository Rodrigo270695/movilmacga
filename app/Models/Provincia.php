<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provincia extends Model
{
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

    public function distritos(): HasMany
    {
        return $this->hasMany(Distrito::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
