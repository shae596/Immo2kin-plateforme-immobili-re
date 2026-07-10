<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Verification\ReviewVerificationRequest;
use App\Http\Resources\VerificationResource;
use App\Models\Verification;
use App\Services\VerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminVerificationController extends Controller
{
    public function __construct(
        private readonly VerificationService $verifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $paginator = $this->verifications->listAdmin(
            $request->only(['status', 'type']),
            (int) $request->input('per_page', 15),
        );

        return response()->json([
            'data' => VerificationResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function approve(ReviewVerificationRequest $request, Verification $verification): JsonResponse
    {
        $updated = $this->verifications->approve(
            $request->user(),
            $verification,
            $request->validated('admin_notes'),
        );

        return response()->json([
            'message' => 'Demande approuvée.',
            'verification' => new VerificationResource($updated),
        ]);
    }

    public function reject(ReviewVerificationRequest $request, Verification $verification): JsonResponse
    {
        $updated = $this->verifications->reject(
            $request->user(),
            $verification,
            $request->validated('admin_notes'),
        );

        return response()->json([
            'message' => 'Demande refusée.',
            'verification' => new VerificationResource($updated),
        ]);
    }
}
