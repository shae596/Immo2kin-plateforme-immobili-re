<?php

namespace App\Services;

use App\Enums\MobileMoneyProvider;
use App\Enums\PaymentMethod;
use App\Enums\PaymentStatus;
use App\Enums\ReservationStatus;
use App\Models\Payment;
use App\Models\Reservation;
use App\Models\User;
use App\Repositories\PaymentRepository;
use App\Services\Payments\MobileMoneyGateway;
use App\Services\Payments\StripePaymentGatewayInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly PaymentRepository $payments,
        private readonly StripePaymentGatewayInterface $stripe,
        private readonly MobileMoneyGateway $mobileMoney,
    ) {}

    public function find(int $id): Payment
    {
        return $this->payments->findById($id);
    }

    /**
     * @return array{payment: Payment, client_secret: string}
     */
    public function initiateStripe(User $user, Reservation $reservation): array
    {
        $this->assertCanPay($user, $reservation);

        return DB::transaction(function () use ($user, $reservation) {
            $payment = $this->payments->create([
                'reservation_id' => $reservation->id,
                'user_id' => $user->id,
                'amount' => $reservation->total_price,
                'currency' => $reservation->currency,
                'method' => PaymentMethod::Stripe,
                'status' => PaymentStatus::Pending,
                'provider' => 'stripe',
            ]);

            $intent = $this->stripe->createPaymentIntent($payment, $reservation, $user);

            $payment->provider_payment_id = $intent['payment_intent_id'];
            $payment->metadata = ['client_secret' => $intent['client_secret']];
            $payment->save();

            return [
                'payment' => $this->payments->findById($payment->id),
                'client_secret' => $intent['client_secret'],
            ];
        });
    }

    /**
     * @return array{payment: Payment, instructions: string}
     */
    public function initiateMobileMoney(
        User $user,
        Reservation $reservation,
        MobileMoneyProvider $provider,
        string $phone,
    ): array {
        $this->assertCanPay($user, $reservation);

        return DB::transaction(function () use ($user, $reservation, $provider, $phone) {
            $payment = $this->payments->create([
                'reservation_id' => $reservation->id,
                'user_id' => $user->id,
                'amount' => $reservation->total_price,
                'currency' => $reservation->currency,
                'method' => PaymentMethod::MobileMoney,
                'status' => PaymentStatus::Processing,
                'provider' => $provider->value,
                'mobile_phone' => $phone,
            ]);

            $init = $this->mobileMoney->initiate($payment, $provider, $phone);

            $payment->provider_payment_id = $init['reference'];
            $payment->metadata = ['instructions' => $init['instructions']];
            $payment->save();

            if (config('services.mobile_money.auto_confirm', false)) {
                $payment = $this->payments->markPaid($payment, ['simulated' => true]);
            }

            return [
                'payment' => $this->payments->findById($payment->id),
                'instructions' => $init['instructions'],
            ];
        });
    }

    public function confirmStripePayment(User $user, Payment $payment): Payment
    {
        $this->assertPaymentOwner($user, $payment);

        if ($payment->method !== PaymentMethod::Stripe || $payment->provider_payment_id === null) {
            throw ValidationException::withMessages([
                'payment' => ['Paiement Stripe invalide.'],
            ]);
        }

        if ($payment->isPaid()) {
            return $payment;
        }

        $status = $this->stripe->syncFromIntentId($payment->provider_payment_id);

        if ($status === 'succeeded') {
            return $this->payments->markPaid($payment, ['stripe_status' => $status]);
        }

        if (in_array($status, ['canceled', 'requires_payment_method'], true)) {
            return $this->payments->markFailed($payment, $status ?? 'failed');
        }

        return $this->payments->findById($payment->id);
    }

    public function handleStripeWebhook(string $paymentIntentId, string $status): ?Payment
    {
        $payment = $this->payments->findByProviderReference('stripe', $paymentIntentId);

        if ($payment === null || $payment->isPaid()) {
            return $payment;
        }

        if ($status === 'succeeded') {
            return $this->payments->markPaid($payment, ['stripe_webhook' => true]);
        }

        if (in_array($status, ['canceled', 'payment_failed'], true)) {
            return $this->payments->markFailed($payment, $status);
        }

        return $payment;
    }

    public function confirmMobileMoney(User $user, Payment $payment): Payment
    {
        $this->assertPaymentOwner($user, $payment);

        if ($payment->method !== PaymentMethod::MobileMoney) {
            throw ValidationException::withMessages([
                'payment' => ['Ce paiement n\'est pas un Mobile Money.'],
            ]);
        }

        if ($payment->isPaid()) {
            return $payment;
        }

        if (! config('services.mobile_money.allow_manual_confirm', true) && ! app()->environment('local', 'testing')) {
            throw ValidationException::withMessages([
                'payment' => ['La confirmation manuelle n\'est pas autorisée.'],
            ]);
        }

        return $this->payments->markPaid($payment, ['manual_confirm' => true]);
    }

    private function assertCanPay(User $user, Reservation $reservation): void
    {
        if ($user->id !== $reservation->user_id) {
            throw ValidationException::withMessages([
                'authorization' => ['Seul le client ayant réservé peut payer.'],
            ]);
        }

        if ($reservation->status !== ReservationStatus::Confirmed) {
            throw ValidationException::withMessages([
                'reservation' => ['Seules les réservations confirmées peuvent être payées.'],
            ]);
        }

        if ($reservation->isPaid() || $this->payments->hasSuccessfulPayment($reservation)) {
            throw ValidationException::withMessages([
                'payment' => ['Cette réservation est déjà payée.'],
            ]);
        }
    }

    private function assertPaymentOwner(User $user, Payment $payment): void
    {
        if ($user->id !== $payment->user_id) {
            throw ValidationException::withMessages([
                'authorization' => ['Accès refusé à ce paiement.'],
            ]);
        }
    }
}
