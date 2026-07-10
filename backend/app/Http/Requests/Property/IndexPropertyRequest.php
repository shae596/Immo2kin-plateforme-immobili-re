<?php

namespace App\Http\Requests\Property;

use App\Enums\ListingType;
use App\Enums\PropertySort;
use App\Enums\PropertyStatus;
use App\Enums\PropertyType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class IndexPropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'q' => ['sometimes', 'string', 'max:200'],
            'city' => ['sometimes', 'string', 'max:100'],
            'commune' => ['sometimes', 'string', 'max:100'],
            'type' => ['sometimes', Rule::enum(PropertyType::class)],
            'listing_type' => ['sometimes', Rule::enum(ListingType::class)],
            'min_price' => ['sometimes', 'numeric', 'min:0'],
            'max_price' => ['sometimes', 'numeric', 'min:0'],
            'min_rooms' => ['sometimes', 'integer', 'min:0', 'max:50'],
            'min_area' => ['sometimes', 'numeric', 'min:0'],
            'has_kitchen' => ['sometimes', 'boolean'],
            'has_living_room' => ['sometimes', 'boolean'],
            'has_store' => ['sometimes', 'boolean'],
            'amenity_ids' => ['sometimes', 'array'],
            'amenity_ids.*' => ['integer', 'exists:amenities,id'],
            'lat' => ['sometimes', 'numeric', 'between:-90,90'],
            'lng' => ['sometimes', 'numeric', 'between:-180,180'],
            'radius_km' => ['sometimes', 'numeric', 'min:0.1', 'max:200'],
            'sort' => ['sometimes', Rule::enum(PropertySort::class)],
            'status' => ['sometimes', Rule::enum(PropertyStatus::class)],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }
}
