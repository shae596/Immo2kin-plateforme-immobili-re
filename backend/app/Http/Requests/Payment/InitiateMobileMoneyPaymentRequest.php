<?php

namespace App\Http\Requests\Payment;

use App\Enums\MobileMoneyProvider;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InitiateMobileMoneyPaymentRequest extends FormRequest
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
            'phone' => ['required', 'string', 'max:20'],
            'provider' => ['required', 'string', Rule::in(MobileMoneyProvider::values())],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'phone.required' => 'Le numéro Mobile Money est obligatoire.',
            'provider.in' => 'Opérateur Mobile Money invalide (orange, airtel, mpesa).',
        ];
    }
}
