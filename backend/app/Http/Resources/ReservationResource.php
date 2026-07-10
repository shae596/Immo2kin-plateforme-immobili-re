<?php

namespace App\Http\Resources;

use App\Services\ReviewService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Reservation */
class ReservationResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = $request->user();
        $canReview = false;

        if (
            $user !== null
            && $user->id === $this->user_id
            && $this->relationLoaded('property')
            && $this->property !== null
        ) {
            $canReview = app(ReviewService::class)->canUserReview($user, $this->property);
        }

        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'user_id' => $this->user_id,
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'status' => $this->status->value,
            'guests' => $this->guests,
            'nights' => $this->nights(),
            'total_price' => $this->total_price,
            'currency' => $this->currency,
            'message' => $this->message,
            'paid_at' => $this->paid_at?->toIso8601String(),
            'is_paid' => $this->isPaid(),
            'can_review' => $canReview,
            'property' => $this->whenLoaded('property', fn () => [
                'id' => $this->property->id,
                'title' => $this->property->title,
                'city' => $this->property->city,
                'commune' => $this->property->commune,
                'price' => $this->property->price,
                'currency' => $this->property->currency,
                'listing_type' => $this->property->listing_type?->value,
                'owner' => $this->property->relationLoaded('owner') && $this->property->owner
                    ? [
                        'id' => $this->property->owner->id,
                        'name' => $this->property->owner->name,
                    ]
                    : null,
            ]),
            'user' => $this->whenLoaded('user', fn () => $this->user
                ? [
                    'id' => $this->user->id,
                    'name' => $this->user->name,
                    'email' => $this->user->email,
                    'phone' => $this->user->phone,
                ]
                : null),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
