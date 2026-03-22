<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PdvBusinessTypeOperator extends Model
{
    use HasFactory;

    public const SALE_PREPAGO = 'prepago';

    public const SALE_POSPAGO = 'pospago';

    protected $fillable = [
        'pdv_business_type_id',
        'operator_id',
        'sale_mode',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    public function pdvBusinessType(): BelongsTo
    {
        return $this->belongsTo(PdvBusinessType::class);
    }

    public function operator(): BelongsTo
    {
        return $this->belongsTo(Operator::class);
    }

    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    public function scopePrepago($query)
    {
        return $query->where('sale_mode', self::SALE_PREPAGO);
    }

    public function scopePospago($query)
    {
        return $query->where('sale_mode', self::SALE_POSPAGO);
    }
}
