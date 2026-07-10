<?php

namespace App\Models;

use App\Enums\ReservationStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Reservation extends Model
{
    /** @use HasFactory<\Database\Factories\ReservationFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'property_id',
        'user_id',
        'start_date',
        'end_date',
        'status',
        'guests',
        'total_price',
        'currency',
        'message',
        'paid_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => ReservationStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
            'total_price' => 'decimal:2',
            'guests' => 'integer',
            'paid_at' => 'datetime',
        ];
    }

    public function property(): BelongsTo
    {
        return $this->belongsTo(Property::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function payments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Payment::class);
    }

    public function isPaid(): bool
    {
        return $this->paid_at !== null;
    }

    public function isBlockingAvailability(): bool
    {
        return in_array($this->status, [
            ReservationStatus::Pending,
            ReservationStatus::Confirmed,
        ], true);
    }

    public function nights(): int
    {
        return max(1, $this->start_date->diffInDays($this->end_date) + 1);
    }

    public function review(): \Illuminate\Database\Eloquent\Relations\HasOne
    {
        return $this->hasOne(Review::class);
    }

    public function isEligibleForReview(): bool
    {
        return $this->status === ReservationStatus::Confirmed
            && $this->end_date->lte(now()->startOfDay());
    }
}
