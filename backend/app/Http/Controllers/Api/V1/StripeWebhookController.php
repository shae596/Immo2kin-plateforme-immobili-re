<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Stripe\Exception\SignatureVerificationException;
use Stripe\Webhook;

class StripeWebhookController extends Controller
{
    public function __construct(
        private readonly PaymentService $payments,
    ) {}

    public function __invoke(Request $request): JsonResponse
    {
        $secret = config('services.stripe.webhook_secret');
        $payload = $request->getContent();
        $signature = $request->header('Stripe-Signature');

        if (is_string($secret) && $secret !== '' && is_string($signature)) {
            try {
                $event = Webhook::constructEvent($payload, $signature, $secret);
            } catch (SignatureVerificationException|\UnexpectedValueException) {
                return response()->json(['message' => 'Signature webhook invalide.'], 400);
            }
        } else {
            $event = json_decode($payload, false);
            if ($event === null) {
                return response()->json(['message' => 'Payload invalide.'], 400);
            }
        }

        $type = $event->type ?? null;
        $intent = $event->data->object ?? null;

        if ($type === 'payment_intent.succeeded' && isset($intent->id)) {
            $this->payments->handleStripeWebhook($intent->id, 'succeeded');
        }

        if (in_array($type, ['payment_intent.payment_failed', 'payment_intent.canceled'], true) && isset($intent->id)) {
            $this->payments->handleStripeWebhook($intent->id, 'payment_failed');
        }

        return response()->json(['received' => true]);
    }
}
