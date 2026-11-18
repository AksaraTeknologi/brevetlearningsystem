<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class IntegrationAuditLog extends Model
{
    public const UPDATED_AT = null;

    protected $fillable = ['action', 'target_type', 'target_id', 'payload'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }

    public function client()
    {
        return $this->belongsTo(IntegrationClient::class, 'integration_client_id');
    }
}
