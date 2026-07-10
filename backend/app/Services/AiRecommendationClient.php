<?php

namespace App\Services;

use App\Support\RecommendationScorer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiRecommendationClient
{
    public function __construct(
        private readonly RecommendationScorer $scorer,
    ) {}

    /**
     * @param  list<array{property_id: int, event_type: string, weight: int}>  $signals
     * @param  list<array<string, mixed>>  $candidates
     * @return list<array{property_id: int, score: float}>
     */
    public function rankForUser(array $signals, array $candidates, int $limit = 12): array
    {
        $payload = [
            'signals' => $signals,
            'candidates' => $candidates,
            'limit' => $limit,
        ];

        $remote = $this->post('/api/v1/recommendations/rank', $payload);

        if ($remote !== null) {
            return $remote;
        }

        return $this->scorer->rankForUser($signals, $candidates, $limit);
    }

    /**
     * @param  array<string, mixed>  $source
     * @param  list<array<string, mixed>>  $candidates
     * @return list<array{property_id: int, score: float}>
     */
    public function rankSimilar(array $source, array $candidates, int $limit = 6): array
    {
        $payload = [
            'source' => $source,
            'candidates' => $candidates,
            'limit' => $limit,
        ];

        $remote = $this->post('/api/v1/similar/rank', $payload);

        if ($remote !== null) {
            return $remote;
        }

        return $this->scorer->rankSimilar($source, $candidates, $limit);
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return list<array{property_id: int, score: float}>|null
     */
    private function post(string $path, array $payload): ?array
    {
        $baseUrl = rtrim((string) config('services.ai.url'), '/');

        if ($baseUrl === '') {
            return null;
        }

        try {
            $response = Http::timeout(3)
                ->withHeaders([
                    'X-API-Key' => (string) config('services.ai.key'),
                    'Accept' => 'application/json',
                ])
                ->post("{$baseUrl}{$path}", $payload);

            if (! $response->successful()) {
                return null;
            }

            /** @var array{data?: list<array{property_id: int, score: float}>} $body */
            $body = $response->json();

            return $body['data'] ?? null;
        } catch (\Throwable $e) {
            Log::debug('AI service indisponible, fallback local', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }
}
