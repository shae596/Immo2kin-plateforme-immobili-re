<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Reservation\PropertyAvailabilityRequest;
use App\Models\Property;
use App\Services\ReservationService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;

class PropertyAvailabilityController extends Controller
{
    public function __construct(
        private readonly ReservationService $reservations,
    ) {}

    public function show(PropertyAvailabilityRequest $request, Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        $from = $request->filled('from')
            ? Carbon::parse($request->input('from'))->startOfDay()
            : now()->startOfDay();

        $to = $request->filled('to')
            ? Carbon::parse($request->input('to'))->startOfDay()
            : $from->copy()->addMonths(3);

        if ($to->lt($from)) {
            $to = $from->copy()->addMonths(3);
        }

        return response()->json($this->reservations->availability($property, $from, $to));
    }
}
