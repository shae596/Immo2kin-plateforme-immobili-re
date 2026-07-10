<?php

namespace App\Services\Payments;

use App\Enums\MobileMoneyProvider;
use App\Models\Payment;

class MobileMoneyGateway
{
    /**
     * Simule l'envoi d'une demande USSR/push Mobile Money (RDC).
     * En production : brancher Flutterwave, pawaPay, etc.
     *
     * @return array{reference: string, instructions: string}
     */
    public function initiate(Payment $payment, MobileMoneyProvider $provider, string $phone): array
    {
        $reference = 'mm_'.strtoupper($provider->value).'_'.$payment->id.'_'.now()->timestamp;

        $label = $provider->label();

        return [
            'reference' => $reference,
            'instructions' => "Validez le paiement de {$payment->amount} {$payment->currency} sur votre téléphone {$phone} via {$label}. Référence : {$reference}.",
        ];
    }
}
