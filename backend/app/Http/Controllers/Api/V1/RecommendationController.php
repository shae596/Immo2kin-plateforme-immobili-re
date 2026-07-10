<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Recommendation\StoreRecommendationEventRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Services\RecommendationEventService;
use App\Services\RecommendationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RecommendationController extends Controller
{
    public function __construct(
        private readonly RecommendationService $recommendations,
        private readonly RecommendationEventService $events,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $limit = min(24, max(1, (int) $request->input('limit', 12)));
        $items = $this->recommendations->forUser($request->user(), $limit);

        return response()->json([
            'data' => PropertyResource::collection($items),
            'meta' => [
                'total' => $items->count(),
                'personalized' => $request->user() !== null,
                'source' => $request->user() !== null ? 'hybrid' : 'popular',
            ],
        ]);
    }

    public function similar(Request $request, Property $property): JsonResponse
    {
        $limit = min(12, max(1, (int) $request->input('limit', 6)));
        $items = $this->recommendations->similar($property, $limit);

        return response()->json([
            'data' => PropertyResource::collection($items),
            'meta' => [
                'property_id' => $property->id,
                'total' => $items->count(),
            ],
        ]);
    }

    public function storeEvent(StoreRecommendationEventRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $event = $this->events->record(
            $request->user(),
            $validated['property_id'] ?? null,
            \App\Enums\RecommendationEventType::from($validated['event_type']),
            $validated['metadata'] ?? null,
        );

        return response()->json([
            'message' => 'Événement enregistré.',
            'event_id' => $event?->id,
        ], 201);
    }
}
