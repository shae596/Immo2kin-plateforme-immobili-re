<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\AdminStatsService;
use Illuminate\Http\JsonResponse;

class AdminStatsController extends Controller
{
    public function __construct(
        private readonly AdminStatsService $stats,
    ) {}

    public function __invoke(): JsonResponse
    {
        return response()->json([
            'stats' => $this->stats->overview(),
        ]);
    }
}
