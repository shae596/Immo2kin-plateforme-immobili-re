<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Property */
class PropertyMapMarkerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'price' => $this->price,
            'currency' => $this->currency,
            'type' => $this->type->value,
            'listing_type' => $this->listing_type->value,
            'city' => $this->city,
            'commune' => $this->commune,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ];
    }
}
