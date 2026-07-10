<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\AmenityResource;
use App\Repositories\AmenityRepository;
use Illuminate\Http\JsonResponse;

class AmenityController extends Controller
{
    public function __construct(
        private readonly AmenityRepository $amenities,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'data' => AmenityResource::collection($this->amenities->all()),
        ]);
    }
}
