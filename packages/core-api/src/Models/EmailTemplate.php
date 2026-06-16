<?php

namespace Fleetbase\Models;

use Fleetbase\Traits\HasUuid;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailTemplate extends Model
{
    use HasUuid;

    protected $table = 'email_templates';

    protected $fillable = [
        'company_uuid',
        'template_key',
        'part',
        'locale',
        'subject',
        'content',
        'description',
        'variables_schema',
        'is_active',
        'version',
        'meta',
    ];

    protected $casts = [
        'variables_schema' => 'array',
        'meta' => 'array',
        'is_active' => 'boolean',
        'version' => 'integer',
    ];

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_uuid', 'uuid');
    }
}
