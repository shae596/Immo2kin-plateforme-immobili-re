<?php

namespace App\Services\Payments;

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;

interface StripePaymentGatewayInterface
{
    /**
     * @return array{payment_intent_id: string, client_secret: string}
     */
    public function createPaymentIntent(Payment $payment, Reservation $reservation, User $user): array;

    public function syncFromIntentId(string $paymentIntentId): ?string;
}
