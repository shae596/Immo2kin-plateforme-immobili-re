<?php

namespace App\Support;

/**
 * Scoring local (fallback si le microservice IA est indisponible).
 */
class RecommendationScorer
{
    /**
     * @param  list<array{property_id: int, event_type: string, weight: int}>  $signals
     * @param  list<array<string, mixed>>  $candidates
     * @return list<array{property_id: int, score: float}>
     */
    public function rankForUser(array $signals, array $candidates, int $limit = 12): array
    {
        $profile = $this->buildProfile($signals, $candidates);
        $excluded = $this->stronglyInteractedIds($signals);

        $scored = [];

        foreach ($candidates as $candidate) {
            $id = (int) $candidate['id'];

            if (in_array($id, $excluded, true)) {
                continue;
            }

            $score = 0.0;
            $score += $this->matchScore($profile, $candidate);
            $score += ($candidate['is_verified'] ?? false) ? 1.5 : 0.0;
            $score += min(2.0, ((float) ($candidate['rating_average'] ?? 0)) / 2.5);

            $scored[] = ['property_id' => $id, 'score' => round($score, 2)];
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, $limit);
    }

    /**
     * @param  array<string, mixed>  $source
     * @param  list<array<string, mixed>>  $candidates
     * @return list<array{property_id: int, score: float}>
     */
    public function rankSimilar(array $source, array $candidates, int $limit = 6): array
    {
        $sourceId = (int) $source['id'];
        $scored = [];

        foreach ($candidates as $candidate) {
            $id = (int) $candidate['id'];

            if ($id === $sourceId) {
                continue;
            }

            $score = 0.0;

            if (($candidate['commune'] ?? null) === ($source['commune'] ?? null)) {
                $score += 5.0;
            } elseif (($candidate['city'] ?? null) === ($source['city'] ?? null)) {
                $score += 3.0;
            }

            if (($candidate['type'] ?? null) === ($source['type'] ?? null)) {
                $score += 3.0;
            }

            if (($candidate['listing_type'] ?? null) === ($source['listing_type'] ?? null)) {
                $score += 2.0;
            }

            $score += $this->priceProximityScore(
                (float) ($source['price'] ?? 0),
                (float) ($candidate['price'] ?? 0),
                0.35,
            );

            $sourceAmenities = $source['amenity_ids'] ?? [];
            $candidateAmenities = $candidate['amenity_ids'] ?? [];

            if ($sourceAmenities !== [] && $candidateAmenities !== []) {
                $overlap = count(array_intersect($sourceAmenities, $candidateAmenities));
                $score += $overlap * 0.5;
            }

            if ($candidate['is_verified'] ?? false) {
                $score += 1.0;
            }

            $scored[] = ['property_id' => $id, 'score' => round($score, 2)];
        }

        usort($scored, fn ($a, $b) => $b['score'] <=> $a['score']);

        return array_slice($scored, 0, $limit);
    }

    /**
     * @param  list<array{property_id: int, event_type: string, weight: int}>  $signals
     * @param  list<array<string, mixed>>  $candidates
     * @return array{
     *     cities: array<string, float>,
     *     communes: array<string, float>,
     *     types: array<string, float>,
     *     listing_types: array<string, float>,
     *     avg_price: float|null
     * }
     */
    private function buildProfile(array $signals, array $candidates): array
    {
        $byId = [];

        foreach ($candidates as $candidate) {
            $byId[(int) $candidate['id']] = $candidate;
        }

        $cities = [];
        $communes = [];
        $types = [];
        $listingTypes = [];
        $prices = [];

        foreach ($signals as $signal) {
            $property = $byId[$signal['property_id']] ?? null;

            if ($property === null) {
                continue;
            }

            $w = max(1, abs($signal['weight']));

            if (! empty($property['city'])) {
                $cities[$property['city']] = ($cities[$property['city']] ?? 0) + $w;
            }

            if (! empty($property['commune'])) {
                $communes[$property['commune']] = ($communes[$property['commune']] ?? 0) + $w;
            }

            if (! empty($property['type'])) {
                $types[$property['type']] = ($types[$property['type']] ?? 0) + $w;
            }

            if (! empty($property['listing_type'])) {
                $listingTypes[$property['listing_type']] = ($listingTypes[$property['listing_type']] ?? 0) + $w;
            }

            if (isset($property['price'])) {
                $prices[] = (float) $property['price'];
            }
        }

        return [
            'cities' => $cities,
            'communes' => $communes,
            'types' => $types,
            'listing_types' => $listingTypes,
            'avg_price' => $prices !== [] ? array_sum($prices) / count($prices) : null,
        ];
    }

    /**
     * @param  array{
     *     cities: array<string, float>,
     *     communes: array<string, float>,
     *     types: array<string, float>,
     *     listing_types: array<string, float>,
     *     avg_price: float|null
     * }  $profile
     * @param  array<string, mixed>  $candidate
     */
    private function matchScore(array $profile, array $candidate): float
    {
        $score = 0.0;

        $commune = $candidate['commune'] ?? null;
        $city = $candidate['city'] ?? null;
        $type = $candidate['type'] ?? null;
        $listingType = $candidate['listing_type'] ?? null;

        if ($commune !== null && isset($profile['communes'][$commune])) {
            $score += 3.0;
        } elseif ($city !== null && isset($profile['cities'][$city])) {
            $score += 2.0;
        }

        if ($type !== null && isset($profile['types'][$type])) {
            $score += 2.0;
        }

        if ($listingType !== null && isset($profile['listing_types'][$listingType])) {
            $score += 1.0;
        }

        if ($profile['avg_price'] !== null && isset($candidate['price'])) {
            $score += $this->priceProximityScore($profile['avg_price'], (float) $candidate['price'], 0.25);
        }

        return $score;
    }

    private function priceProximityScore(float $reference, float $price, float $tolerance): float
    {
        if ($reference <= 0 || $price <= 0) {
            return 0.0;
        }

        $ratio = abs($price - $reference) / $reference;

        if ($ratio > $tolerance) {
            return 0.0;
        }

        return 2.0 * (1 - $ratio / $tolerance);
    }

    /**
     * @param  list<array{property_id: int, event_type: string, weight: int}>  $signals
     * @return list<int>
     */
    private function stronglyInteractedIds(array $signals): array
    {
        $counts = [];

        foreach ($signals as $signal) {
            if (in_array($signal['event_type'], ['favorite', 'reservation'], true)) {
                $counts[$signal['property_id']] = ($counts[$signal['property_id']] ?? 0) + 1;
            }
        }

        return array_keys(array_filter($counts, fn ($c) => $c > 0));
    }
}
