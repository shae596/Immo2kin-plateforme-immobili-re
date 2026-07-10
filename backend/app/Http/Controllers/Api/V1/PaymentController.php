<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Payment\InitiateMobileMoneyPaymentRequest;
use App\Http\Resources\PaymentResource;
use App\Models\Payment;
use App\Models\Reservation;
use App\Enums\MobileMoneyProvider;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $payments,
    ) {}

    public function show(Request $request, Payment $payment): JsonResponse
    {
        $this->authorize('view', $payment);

        return response()->json([
            'payment' => new PaymentResource($this->payments->find($payment->id)),
        ]);
    }

    public function initiateStripe(Request $request, Reservation $reservation): JsonResponse
    {
        $this->authorize('pay', $reservation);

        $result = $this->payments->initiateStripe($request->user(), $reservation);

        return response()->json([
            'message' => 'Paiement Stripe initialisé.',
            'payment' => new PaymentResource($result['payment']),
            'client_secret' => $result['client_secret'],
            'stripe_publishable_key' => config('services.stripe.key'),
        ], 201);
    }

    public function confirmStripe(Request $request, Payment $payment): JsonResponse
    {
        $this->authorize('pay', $payment);

        $payment = $this->payments->confirmStripePayment($request->user(), $payment);

        return response()->json([
            'message' => $payment->isPaid() ? 'Paiement réussi.' : 'Paiement en cours de traitement.',
            'payment' => new PaymentResource($payment),
        ]);
    }

    public function initiateMobileMoney(
        InitiateMobileMoneyPaymentRequest $request,
        Reservation $reservation,
    ): JsonResponse {
        $this->authorize('pay', $reservation);

        $result = $this->payments->initiateMobileMoney(
            $request->user(),
            $reservation,
            MobileMoneyProvider::from($request->validated('provider')),
            $request->validated('phone'),
        );

        return response()->json([
            'message' => 'Demande Mobile Money envoyée.',
            'payment' => new PaymentResource($result['payment']),
            'instructions' => $result['instructions'],
        ], 201);
    }

    public function confirmMobileMoney(Request $request, Payment $payment): JsonResponse
    {
        $this->authorize('pay', $payment);

        $payment = $this->payments->confirmMobileMoney($request->user(), $payment);

        return response()->json([
            'message' => 'Paiement Mobile Money confirmé.',
            'payment' => new PaymentResource($payment),
        ]);
    }
}
