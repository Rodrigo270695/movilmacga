<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\Pivot;

class PdvOperator extends Pivot
{
    use HasFactory;

    protected $table = 'pdv_operator';

    protected $fillable = [
        'pdv_id',
        'operator_id',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    /**
     * Get the PDV for this pivot record.
     */
    public function pdv(): BelongsTo
    {
        return $this->belongsTo(Pdv::class);
    }

    /**
     * Get the operator for this pivot record.
     */
    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }

    /**
     * Scope for active associations only.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
