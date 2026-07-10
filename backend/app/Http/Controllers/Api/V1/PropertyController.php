<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\IndexPropertyRequest;
use App\Http\Requests\Property\StorePropertyRequest;
use App\Http\Requests\Property\UpdatePropertyRequest;
use App\Http\Resources\PropertyMapMarkerResource;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Services\PropertyService;
use App\Services\RecommendationEventService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function __construct(
        private readonly PropertyService $properties,
        private readonly RecommendationEventService $recommendationEvents,
    ) {}

    public function index(IndexPropertyRequest $request): JsonResponse
    {
        $filters = $this->searchFilters($request);
        $paginator = $this->properties->listPublished(
            $filters,
            (int) ($request->input('per_page', 12)),
            (int) ($request->input('page', 1)),
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

    public function map(IndexPropertyRequest $request): JsonResponse
    {
        $markers = $this->properties->mapMarkers($this->searchFilters($request));

        return response()->json([
            'data' => PropertyMapMarkerResource::collection($markers),
            'meta' => [
                'total' => $markers->count(),
            ],
        ]);
    }

    public function myProperties(IndexPropertyRequest $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $paginator = $this->properties->listForOwner(
            $user,
            $this->searchFilters($request),
            (int) ($request->input('per_page', 12)),
            (int) ($request->input('page', 1)),
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

    public function show(Request $request, Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        $property = $this->properties->find($property->id);

        $this->recommendationEvents->recordView($request->user(), $property->id);

        return response()->json([
            'property' => new PropertyResource($property),
        ]);
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $property = $this->properties->create(
            $request->user(),
            $request->validated(),
        );

        return response()->json([
            'message' => 'Annonce créée.',
            'property' => new PropertyResource($property),
        ], 201);
    }

    public function update(UpdatePropertyRequest $request, Property $property): JsonResponse
    {
        $property = $this->properties->update(
            $property,
            $request->validated(),
        );

        return response()->json([
            'message' => 'Annonce mise à jour.',
            'property' => new PropertyResource($property),
        ]);
    }

    public function destroy(Request $request, Property $property): JsonResponse
    {
        $this->authorize('delete', $property);

        $this->properties->delete($property);

        return response()->json([
            'message' => 'Annonce supprimée.',
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function searchFilters(IndexPropertyRequest $request): array
    {
        $filters = $request->validated();
        unset($filters['page'], $filters['per_page']);

        return $filters;
    }
}
