<?php

namespace App\Models;

use App\Support\MediaStorage;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PropertyVideo extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'property_id',
        'path',
    ];

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function url(): string
    {
        return MediaStorage::disk()->url($this->path);
    }
}
