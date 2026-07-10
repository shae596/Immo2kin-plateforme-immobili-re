<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Enums\RecommendationEventType;
use App\Services\FavoriteService;
use App\Services\RecommendationEventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteController extends Controller
{
    public function __construct(
        private readonly FavoriteService $favorites,
        private readonly RecommendationEventService $recommendationEvents,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $paginator = $this->favorites->list(
            $user,
            (int) $request->input('per_page', 12),
        );

        return response()->json([
            'data' => PropertyResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function store(Request $request, Property $property): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $this->favorites->add($user, $property);
        $this->recommendationEvents->record($user, $property->id, RecommendationEventType::Favorite);

        return response()->json([
            'message' => 'Annonce ajoutée aux favoris.',
        ], 201);
    }

    public function destroy(Request $request, Property $property): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $this->favorites->remove($user, $property);
        $this->recommendationEvents->record($user, $property->id, RecommendationEventType::Unfavorite);

        return response()->json([
            'message' => 'Annonce retirée des favoris.',
        ]);
    }
}
