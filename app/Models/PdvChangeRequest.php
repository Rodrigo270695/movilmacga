<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PdvChangeRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'pdv_id',
        'user_id',
        'zonal_id',
        'status',
        'original_data',
        'changes',
        'reason',
        'rejection_reason',
        'approved_at',
        'rejected_at',
    ];

    protected $casts = [
        'original_data' => 'array',
        'changes' => 'array',
        'approved_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    // Relationships
    public function pdv(): BelongsTo
    {
        return $this->belongsTo(Pdv::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function zonal(): BelongsTo
    {
        return $this->belongsTo(Zonal::class);
    }

    /**
     * Obtener los supervisores activos del zonal
     */
    public function getSupervisorsAttribute()
    {
        return $this->zonal->activeZonalSupervisors;
    }

    // Scopes
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopeRejected($query)
    {
        return $query->where('status', 'rejected');
    }

    public function scopeByZonal($query, int $zonalId)
    {
        return $query->where('zonal_id', $zonalId);
    }

    /**
     * Scope para obtener solicitudes que puede aprobar un supervisor
     * (basado en los zonales que tiene asignados)
     */
    public function scopeBySupervisor($query, int $supervisorId)
    {
        return $query->whereHas('zonal.zonalSupervisors', function ($q) use ($supervisorId) {
            $q->where('user_id', $supervisorId)
              ->where('is_active', true);
        });
    }

    public function scopeByUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeByPdv($query, int $pdvId)
    {
        return $query->where('pdv_id', $pdvId);
    }

    // Accessors
    public function getIsPendingAttribute(): bool
    {
        return $this->status === 'pending';
    }

    public function getIsApprovedAttribute(): bool
    {
        return $this->status === 'approved';
    }

    public function getIsRejectedAttribute(): bool
    {
        return $this->status === 'rejected';
    }

    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            'pending' => 'Pendiente',
            'approved' => 'Aprobada',
            'rejected' => 'Rechazada',
            default => 'Desconocido'
        };
    }

    // Methods
    public function approve(): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->update([
            'status' => 'approved',
            'approved_at' => now(),
        ]);

        return true;
    }

    public function reject(?string $reason = null): bool
    {
        if ($this->status !== 'pending') {
            return false;
        }

        $this->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejection_reason' => $reason,
        ]);

        return true;
    }

    /**
     * Aplicar los cambios al PDV
     * 
     * @param array|null $changesOverride Si se proporciona, usa estos cambios en lugar de $this->changes
     */
    public function applyChanges(?array $changesOverride = null): bool
    {
        // Verificar que la solicitud esté aprobada
        if ($this->status !== 'approved') {
            \Log::warning('PdvChangeRequest: No se pueden aplicar cambios a una solicitud no aprobada', [
                'request_id' => $this->id,
                'status' => $this->status
            ]);
            return false;
        }

        // Cargar la relación del PDV si no está cargada
        if (!$this->relationLoaded('pdv')) {
            $this->load('pdv');
        }

        if (!$this->pdv) {
            \Log::error('PdvChangeRequest: No se encontró el PDV asociado', [
                'request_id' => $this->id,
                'pdv_id' => $this->pdv_id
            ]);
            return false;
        }

        // Si se proporcionan cambios externos, usarlos; si no, intentar obtenerlos del modelo
        if ($changesOverride !== null) {
            $changes = $changesOverride;
        } else {
            // Intentar obtener los cambios originales desde la base de datos
            $rawChanges = $this->getRawOriginal('changes');
            if (is_string($rawChanges)) {
                $changes = json_decode($rawChanges, true) ?? [];
            } else {
                $changes = $this->changes ?? [];
            }
        }
        $updateData = [];

        // Solo actualizar los campos que están en los cambios
        // Address: solo si existe y no está vacío
        if (isset($changes['address']) && !empty(trim($changes['address']))) {
            $updateData['address'] = trim($changes['address']);
        }

        // Reference: solo si existe y no está vacío
        if (isset($changes['reference']) && !empty(trim($changes['reference']))) {
            $updateData['reference'] = trim($changes['reference']);
        }

        // Latitude: solo si existe y no es null (puede ser 0, que es válido)
        if (isset($changes['latitude']) && $changes['latitude'] !== null && $changes['latitude'] !== '') {
            $updateData['latitude'] = (float) $changes['latitude'];
        }

        // Longitude: solo si existe y no es null (puede ser 0, que es válido)
        if (isset($changes['longitude']) && $changes['longitude'] !== null && $changes['longitude'] !== '') {
            $updateData['longitude'] = (float) $changes['longitude'];
        }

        // Si no hay cambios para aplicar, no es un error - simplemente retornamos true
        // porque la aprobación ya se guardó
        if (empty($updateData)) {
            \Log::info('PdvChangeRequest: No hay cambios para aplicar al PDV (campos vacíos o null)', [
                'request_id' => $this->id,
                'changes' => $changes
            ]);
            return true; // Retornar true porque la aprobación ya está guardada
        }

        try {
            // Actualizar el PDV
            $updated = $this->pdv->update($updateData);

            \Log::info('PdvChangeRequest: Cambios aplicados al PDV', [
                'request_id' => $this->id,
                'pdv_id' => $this->pdv_id,
                'update_data' => $updateData,
                'updated' => $updated
            ]);

            return $updated;
        } catch (\Exception $e) {
            \Log::error('PdvChangeRequest: Error al aplicar cambios al PDV', [
                'request_id' => $this->id,
                'pdv_id' => $this->pdv_id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }
}
