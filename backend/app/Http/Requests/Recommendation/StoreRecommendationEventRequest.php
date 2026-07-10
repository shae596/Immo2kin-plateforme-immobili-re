<?php

namespace App\Http\Requests\Recommendation;

use App\Enums\RecommendationEventType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRecommendationEventRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'event_type' => ['required', Rule::enum(RecommendationEventType::class)],
            'property_id' => ['nullable', 'integer', 'exists:properties,id'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
