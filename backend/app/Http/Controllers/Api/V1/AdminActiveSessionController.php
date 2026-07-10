<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ActiveSessionResource;
use App\Services\ActiveSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AdminActiveSessionController extends Controller
{
    public function __construct(
        private readonly ActiveSessionService $sessions,
    ) {}

    public function index(Request $request): JsonResponse
    {
        try {
            $active = $this->sessions->listActive();
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'session_driver_unsupported',
                'data' => [],
            ], 422);
        }

        return response()->json([
            'data' => ActiveSessionResource::collection($active),
            'meta' => [
                'session_driver' => config('session.driver'),
                'session_lifetime_minutes' => (int) config('session.lifetime', 120),
                'total' => $active->count(),
            ],
        ]);
    }
}
