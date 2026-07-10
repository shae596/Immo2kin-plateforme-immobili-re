<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Review\StoreReviewRequest;
use App\Http\Requests\Review\UpdateReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Property;
use App\Models\Review;
use App\Enums\RecommendationEventType;
use App\Services\RecommendationEventService;
use App\Services\ReviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function __construct(
        private readonly ReviewService $reviews,
        private readonly RecommendationEventService $recommendationEvents,
    ) {}

    public function index(Request $request, Property $property): JsonResponse
    {
        $paginator = $this->reviews->listForProperty(
            $property,
            (int) $request->input('per_page', 10),
        );

        $summary = $this->reviews->summaryForProperty($property->id);
        $canReview = false;

        $user = $request->user();
        if ($user !== null) {
            $canReview = $this->reviews->canUserReview($user, $property);
        }

        return response()->json([
            'data' => ReviewResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'summary' => $summary,
                'can_review' => $canReview,
            ],
        ]);
    }

    public function store(StoreReviewRequest $request, Property $property): JsonResponse
    {
        $review = $this->reviews->create(
            $request->user(),
            $property,
            $request->validated(),
        );

        $this->recommendationEvents->record(
            $request->user(),
            $property->id,
            RecommendationEventType::Review,
        );

        return response()->json([
            'message' => 'Avis publié.',
            'review' => new ReviewResource($this->reviews->find($review->id)),
        ], 201);
    }

    public function update(UpdateReviewRequest $request, Review $review): JsonResponse
    {
        $this->authorize('update', $review);

        $updated = $this->reviews->update(
            $request->user(),
            $review,
            $request->validated(),
        );

        return response()->json([
            'message' => 'Avis mis à jour.',
            'review' => new ReviewResource($updated),
        ]);
    }

    public function destroy(Request $request, Review $review): JsonResponse
    {
        $this->authorize('delete', $review);

        $this->reviews->delete($request->user(), $review);

        return response()->json([
            'message' => 'Avis supprimé.',
        ]);
    }
}
