<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Distrito extends Model
{
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

    public function localidades(): HasMany
    {
        return $this->hasMany(Localidad::class);
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
