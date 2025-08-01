<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'dni',
        'first_name',
        'last_name',
        'username',
        'phone_number',
        'status',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'status' => 'boolean',
        ];
    }

    /**
     * Get all zonal supervisor assignments for this user.
     */
    public function zonalSupervisorAssignments(): HasMany
    {
        return $this->hasMany(ZonalSupervisor::class);
    }

    /**
     * Get active zonal supervisor assignments for this user.
     */
    public function activeZonalSupervisorAssignments(): HasMany
    {
        return $this->hasMany(ZonalSupervisor::class)->where('is_active', true);
    }



    /**
     * Get all circuit assignments for this user (as seller/agent).
     */
    public function userCircuits(): HasMany
    {
        return $this->hasMany(UserCircuit::class);
    }

    /**
     * Get active circuit assignments for this user.
     */
    public function activeUserCircuits(): HasMany
    {
        return $this->hasMany(UserCircuit::class)->where('is_active', true);
    }

    /**
     * Get GPS tracking records for this user.
     */
    public function gpsTracking(): HasMany
    {
        return $this->hasMany(GpsTracking::class);
    }

    /**
     * Get PDV visits for this user.
     */
    public function pdvVisits(): HasMany
    {
        return $this->hasMany(PdvVisit::class);
    }

    /**
     * Get working sessions for this user.
     */
    public function workingSessions(): HasMany
    {
        return $this->hasMany(WorkingSession::class);
    }

    /**
     * Get active working sessions for this user.
     */
    public function activeWorkingSessions(): HasMany
    {
        return $this->hasMany(WorkingSession::class)->whereNull('ended_at');
    }

    /**
     * Scope to get only supervisors.
     */
    public function scopeSupervisors($query)
    {
        return $query->role('Supervisor');
    }

    /**
     * Scope to get only active users.
     */
    public function scopeActive($query)
    {
        return $query->where('status', true);
    }
}
