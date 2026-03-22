<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PdvBusinessType extends Model
{
    use HasFactory;

    protected $fillable = [
        'pdv_id',
        'business_type',
    ];

    public function pdv(): BelongsTo
    {
        return $this->belongsTo(Pdv::class);
    }

    public function businessTypeOperators(): HasMany
    {
        return $this->hasMany(PdvBusinessTypeOperator::class);
    }

    public function scopeByBusinessType($query, string $businessType)
    {
        return $query->where('business_type', $businessType);
    }
}
