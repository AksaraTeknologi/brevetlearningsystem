<?php

namespace App\Models;

use Illuminate\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Laravel\Sanctum\HasApiTokens;

class IntegrationClient extends Model implements AuthenticatableContract
{
    use Authenticatable, HasUuids, HasApiTokens;

    public const KIND_PLATFORM = 'platform';
    public const KIND_AGENT = 'agent';

    protected $fillable = ['name', 'code', 'kind', 'teacher_id', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function teacher()
    {
        return $this->belongsTo(User::class, 'teacher_id');
    }

    public function auditLogs()
    {
        return $this->hasMany(IntegrationAuditLog::class);
    }

    /** Kelas yang boleh disentuh klien ini (dibatasi pengajar bila diisi). */
    public function courseQuery()
    {
        return Course::query()->when($this->teacher_id, fn ($q) => $q->where('teacher_id', $this->teacher_id));
    }

    public function audit(string $action, ?Model $target = null, array $payload = []): void
    {
        $this->auditLogs()->create([
            'action' => $action,
            'target_type' => $target ? class_basename($target) : null,
            'target_id' => $target?->getKey(),
            'payload' => $payload ?: null,
        ]);
    }
}
