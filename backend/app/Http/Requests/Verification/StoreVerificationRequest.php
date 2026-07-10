<?php

namespace App\Http\Requests\Verification;

use App\Enums\VerificationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreVerificationRequest extends FormRequest
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
            'type' => ['sometimes', Rule::in([VerificationType::Property->value])],
            'property_id' => ['required', 'integer', 'exists:properties,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
