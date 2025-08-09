<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Business extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
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
     * Get all users that belong to this business.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'business_user')
                    ->withPivot(['is_active', 'assigned_at', 'unassigned_at', 'notes', 'assignment_data'])
                    ->withTimestamps();
    }

    /**
     * Get active users that belong to this business.
     */
    public function activeUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'business_user')
                    ->wherePivot('is_active', true)
                    ->withPivot(['is_active', 'assigned_at', 'unassigned_at', 'notes', 'assignment_data'])
                    ->withTimestamps();
    }

    /**
     * Get the zonales for the business.
     */
    public function zonales(): HasMany
    {
        return $this->hasMany(Zonal::class);
    }

    /**
     * Get only active zonales for the business.
     */
    public function activeZonales(): HasMany
    {
        return $this->hasMany(Zonal::class)->where('status', true);
    }

    /**
     * Scope to get only active businesses
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }

    /**
     * Scope to get only inactive businesses
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeInactive($query)
    {
        return $query->where('status', false);
    }

    /**
     * Scope to get businesses with their zonales count
     *
     * @param \Illuminate\Database\Eloquent\Builder $query
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeWithZonalesCount($query)
    {
        return $query->withCount(['zonales', 'activeZonales']);
    }
}
