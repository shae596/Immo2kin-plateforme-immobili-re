<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;

class ProfileController extends Controller
{
    public function __construct(
        private readonly ProfileService $profiles,
    ) {}

    public function update(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $this->authorize('update', $user);

        $user = $this->profiles->update(
            $user,
            $request->validated(),
        );

        return response()->json([
            'message' => 'Profil mis à jour.',
            'user' => new UserResource($user),
        ]);
    }
}
