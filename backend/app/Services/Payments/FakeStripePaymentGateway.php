<?php

namespace App\Services\Payments;

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;

class FakeStripePaymentGateway implements StripePaymentGatewayInterface
{
    /**
     * @return array{payment_intent_id: string, client_secret: string}
     */
    public function createPaymentIntent(Payment $payment, Reservation $reservation, User $user): array
    {
        $id = 'pi_test_'.$payment->id;

        return [
            'payment_intent_id' => $id,
            'client_secret' => $id.'_secret_test',
        ];
    }

    public function syncFromIntentId(string $paymentIntentId): ?string
    {
        return str_starts_with($paymentIntentId, 'pi_test_') ? 'succeeded' : null;
    }
}
