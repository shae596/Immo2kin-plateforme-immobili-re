<?php

namespace App\Http\Resources;

use App\Models\User;
use App\Services\FavoriteService;
use App\Services\ReviewService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Auth;

/** @mixin \App\Models\Property */
class PropertyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $user = Auth::user();
        $isFavorited = false;

        if ($user instanceof User) {
            $isFavorited = app(FavoriteService::class)->isFavorited($user, $this->resource);
        }

        $reviewsSummary = app(ReviewService::class)->summaryForProperty($this->id);

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'status' => $this->status->value,
            'verified_at' => $this->verified_at?->toIso8601String(),
            'is_verified' => $this->isVerified(),
            'reviews_summary' => $reviewsSummary,
            'price' => $this->price,
            'currency' => $this->currency,
            'city' => $this->city,
            'commune' => $this->commune,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'rooms' => $this->rooms,
            'bathrooms' => $this->bathrooms,
            'has_kitchen' => $this->has_kitchen,
            'has_living_room' => $this->has_living_room,
            'has_store' => $this->has_store,
            'area' => $this->area,
            'type' => $this->type->value,
            'listing_type' => $this->listing_type->value,
            'owner' => new UserResource($this->whenLoaded('owner')),
            'images' => PropertyImageResource::collection($this->whenLoaded('images')),
            'videos' => PropertyVideoResource::collection($this->whenLoaded('videos')),
            'amenities' => AmenityResource::collection($this->whenLoaded('amenities')),
            'is_favorited' => $isFavorited,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
