<?php

namespace App\Services\Payments;

use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use Stripe\Exception\ApiErrorException;
use Stripe\StripeClient;

class StripePaymentGateway implements StripePaymentGatewayInterface
{
    private StripeClient $stripe;

    public function __construct()
    {
        $secret = config('services.stripe.secret');

        if (! is_string($secret) || $secret === '') {
            throw new \RuntimeException('Stripe n\'est pas configuré (STRIPE_SECRET).');
        }

        $this->stripe = new StripeClient($secret);
    }

    /**
     * @return array{payment_intent_id: string, client_secret: string}
     */
    public function createPaymentIntent(Payment $payment, Reservation $reservation, User $user): array
    {
        $reservation->loadMissing('property');

        try {
            $intent = $this->stripe->paymentIntents->create([
                'amount' => $this->toMinorUnits((string) $payment->amount, $payment->currency),
                'currency' => strtolower($payment->currency),
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'payment_id' => (string) $payment->id,
                    'reservation_id' => (string) $reservation->id,
                    'property_title' => $reservation->property->title,
                    'user_id' => (string) $user->id,
                ],
            ]);
        } catch (ApiErrorException $e) {
            throw new \RuntimeException('Impossible d\'initialiser le paiement Stripe.', 0, $e);
        }

        return [
            'payment_intent_id' => $intent->id,
            'client_secret' => $intent->client_secret ?? '',
        ];
    }

    public function syncFromIntentId(string $paymentIntentId): ?string
    {
        try {
            $intent = $this->stripe->paymentIntents->retrieve($paymentIntentId);
        } catch (ApiErrorException) {
            return null;
        }

        return $intent->status;
    }

    private function toMinorUnits(string $amount, string $currency): int
    {
        $multiplier = in_array(strtoupper($currency), ['JPY', 'KRW'], true) ? 1 : 100;

        return (int) round((float) $amount * $multiplier);
    }
}
