<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Zonal extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'zonales';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'business_id',
        'name',
        'status',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'status' => 'boolean',
    ];

    /**
     * Get the business that owns the zonal.
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }

    /**
     * Get all supervisor assignments for this zonal.
     */
    public function zonalSupervisors(): HasMany
    {
        return $this->hasMany(ZonalSupervisor::class);
    }

    /**
     * Get active supervisor assignment for this zonal.
     */
    public function activeZonalSupervisor(): HasOne
    {
        return $this->hasOne(ZonalSupervisor::class)->where('is_active', true);
    }

    /**
     * Get the current supervisor for this zonal.
     */
    public function currentSupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id')
            ->join('zonal_supervisors', function ($join) {
                $join->on('users.id', '=', 'zonal_supervisors.user_id')
                     ->where('zonal_supervisors.zonal_id', $this->id)
                     ->where('zonal_supervisors.is_active', true);
            });
    }

    /**
     * Scope para obtener solo zonales activos
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope para obtener solo zonales inactivos
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInactive($query)
    {
        return $query->where('status', false);
    }

    /**
     * Scope to get zonales without business assigned
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeUnassigned($query)
    {
        return $query->whereNull('business_id');
    }

    /**
     * Scope to get zonales by specific business
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @param int $businessId
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeByBusiness($query, int $businessId)
    {
        return $query->where('business_id', $businessId);
    }

    /**
     * Get the circuits for the zonal.
     */
    public function circuits(): HasMany
    {
        return $this->hasMany(Circuit::class);
    }

    /**
     * Get only active circuits for the zonal.
     */
    public function activeCircuits(): HasMany
    {
        return $this->hasMany(Circuit::class)->where('status', true);
    }
}
