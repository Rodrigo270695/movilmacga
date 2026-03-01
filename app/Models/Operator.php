<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Operator extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'color',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    /**
     * Get the PDVs associated with this operator.
     */
    public function pdvs(): BelongsToMany
    {
        return $this->belongsToMany(Pdv::class, 'pdv_operator')
            ->using(PdvOperator::class)
            ->withPivot('status')
            ->withTimestamps();
    }

    /**
     * Scope for active operators only.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
