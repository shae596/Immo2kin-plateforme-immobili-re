<?php

namespace App\Services;

use App\Enums\RecommendationEventType;
use App\Models\RecommendationEvent;
use App\Models\User;
use App\Repositories\RecommendationEventRepository;

class RecommendationEventService
{
    public function __construct(
        private readonly RecommendationEventRepository $events,
    ) {}

    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function record(
        ?User $user,
        ?int $propertyId,
        RecommendationEventType $type,
        ?array $metadata = null,
    ): ?RecommendationEvent {
        if ($user === null && $propertyId === null) {
            return null;
        }

        return $this->events->record($user, $propertyId, $type, $metadata);
    }

    public function recordView(?User $user, int $propertyId): void
    {
        if ($user === null) {
            return;
        }

        $this->events->record($user, $propertyId, RecommendationEventType::View);
    }
}
