<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\StoreReservationRequest;
use App\Http\Resources\ReservationResource;
use App\Models\Property;
use App\Models\Reservation;
use App\Enums\RecommendationEventType;
use App\Services\RecommendationEventService;
use App\Services\ReservationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReservationController extends Controller
{
    public function __construct(
        private readonly ReservationService $reservations,
        private readonly RecommendationEventService $recommendationEvents,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $paginator = $this->reservations->listForGuest($user, (int) $request->input('per_page', 12));

        return response()->json([
            'data' => ReservationResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function indexForOwner(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $paginator = $this->reservations->listForOwner($user, (int) $request->input('per_page', 12));

        return response()->json([
            'data' => ReservationResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, Reservation $reservation): JsonResponse
    {
        $this->authorize('view', $reservation);

        $reservation = $this->reservations->find($reservation->id);

        return response()->json([
            'reservation' => new ReservationResource($reservation),
        ]);
    }

    public function store(StoreReservationRequest $request, Property $property): JsonResponse
    {
        $this->authorize('create', Reservation::class);

        $reservation = $this->reservations->create(
            $request->user(),
            $property,
            $request->validated(),
        );

        $this->recommendationEvents->record(
            $request->user(),
            $property->id,
            RecommendationEventType::Reservation,
        );

        return response()->json([
            'message' => 'Demande de réservation envoyée.',
            'reservation' => new ReservationResource($reservation),
        ], 201);
    }

    public function confirm(Request $request, Reservation $reservation): JsonResponse
    {
        $this->authorize('confirm', $reservation);

        $reservation = $this->reservations->confirm($request->user(), $reservation);

        return response()->json([
            'message' => 'Réservation confirmée.',
            'reservation' => new ReservationResource($reservation),
        ]);
    }

    public function reject(Request $request, Reservation $reservation): JsonResponse
    {
        $this->authorize('reject', $reservation);

        $reservation = $this->reservations->reject($request->user(), $reservation);

        return response()->json([
            'message' => 'Demande refusée.',
            'reservation' => new ReservationResource($reservation),
        ]);
    }

    public function cancel(Request $request, Reservation $reservation): JsonResponse
    {
        $this->authorize('cancel', $reservation);

        $reservation = $this->reservations->cancel($request->user(), $reservation);

        return response()->json([
            'message' => 'Réservation annulée.',
            'reservation' => new ReservationResource($reservation),
        ]);
    }
}
