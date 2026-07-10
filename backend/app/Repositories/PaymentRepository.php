<?php

namespace App\Repositories;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use App\Models\Reservation;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class PaymentRepository
{
    public function findById(int $id): Payment
    {
        $payment = Payment::query()
            ->with(['reservation.property', 'user:id,name,email'])
            ->find($id);

        if ($payment === null) {
            throw new ModelNotFoundException('Paiement introuvable.');
        }

        return $payment;
    }

    public function findByProviderReference(string $provider, string $providerPaymentId): ?Payment
    {
        return Payment::query()
            ->where('provider', $provider)
            ->where('provider_payment_id', $providerPaymentId)
            ->first();
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function create(array $attributes): Payment
    {
        return Payment::query()->create($attributes);
    }

    public function markPaid(Payment $payment, ?array $metadata = null): Payment
    {
        $payment->status = PaymentStatus::Paid;
        $payment->paid_at = now();
        if ($metadata !== null) {
            $payment->metadata = array_merge($payment->metadata ?? [], $metadata);
        }
        $payment->save();

        $payment->reservation()->update(['paid_at' => $payment->paid_at]);

        return $this->findById($payment->id);
    }

    public function markFailed(Payment $payment, ?string $reason = null): Payment
    {
        $payment->status = PaymentStatus::Failed;
        if ($reason !== null) {
            $payment->metadata = array_merge($payment->metadata ?? [], ['failure_reason' => $reason]);
        }
        $payment->save();

        return $this->findById($payment->id);
    }

    public function hasSuccessfulPayment(Reservation $reservation): bool
    {
        return Payment::query()
            ->where('reservation_id', $reservation->id)
            ->where('status', PaymentStatus::Paid)
            ->exists();
    }
}
