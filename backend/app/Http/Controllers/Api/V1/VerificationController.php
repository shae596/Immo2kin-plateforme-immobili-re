<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Verification\StoreVerificationRequest;
use App\Http\Resources\VerificationResource;
use App\Models\Verification;
use App\Services\VerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VerificationController extends Controller
{
    public function __construct(
        private readonly VerificationService $verifications,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 401);

        $paginator = $this->verifications->listForUser($user, (int) $request->input('per_page', 10));

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

    public function store(StoreVerificationRequest $request): JsonResponse
    {
        $verification = $this->verifications->submit(
            $request->user(),
            $request->validated(),
        );

        return response()->json([
            'message' => 'Demande de vérification envoyée.',
            'verification' => new VerificationResource($this->verifications->find($verification->id)),
        ], 201);
    }

    public function show(Request $request, Verification $verification): JsonResponse
    {
        $this->authorize('view', $verification);

        return response()->json([
            'verification' => new VerificationResource($this->verifications->find($verification->id)),
        ]);
    }
}
