<?php

namespace App\Support;

final class KinshasaCommuneCoordinates
{
    /**
     * @return array<string, array{latitude: float, longitude: float}>
     */
    public static function byCommune(): array
    {
        return [
            'Gombe' => ['latitude' => -4.3120, 'longitude' => 15.3050],
            'Bandalungwa' => ['latitude' => -4.3400, 'longitude' => 15.2850],
            'Lingwala' => ['latitude' => -4.3280, 'longitude' => 15.2950],
            'Ngaliema' => ['latitude' => -4.3850, 'longitude' => 15.2450],
            'Limete' => ['latitude' => -4.3500, 'longitude' => 15.3350],
            'Kalamu' => ['latitude' => -4.3600, 'longitude' => 15.3100],
            'Mbudi' => ['latitude' => -4.3650, 'longitude' => 15.1901],
            'Matete' => ['latitude' => -4.3850, 'longitude' => 15.3450],
            'Masina' => ['latitude' => -4.3830, 'longitude' => 15.3910],
            'Kimbanseke' => ['latitude' => -4.3950, 'longitude' => 15.3850],
            'Mont Ngafula' => ['latitude' => -4.4247, 'longitude' => 15.2956],
            'Barumbu' => ['latitude' => -4.3350, 'longitude' => 15.3150],
            'Selembao' => ['latitude' => -4.4200, 'longitude' => 15.3600],
            'Makala' => ['latitude' => -4.3750, 'longitude' => 15.2850],
            'Ndjili' => ['latitude' => -4.3950, 'longitude' => 15.4150],
            'Kisenso' => ['latitude' => -4.4400, 'longitude' => 15.3500],
            'Bumbu' => ['latitude' => -4.3680, 'longitude' => 15.2750],
        ];
    }

    /**
     * @return array{latitude: float, longitude: float}|null
     */
    public static function forCommune(?string $commune): ?array
    {
        if ($commune === null || $commune === '') {
            return null;
        }

        $byCommune = self::byCommune();

        if (isset($byCommune[$commune])) {
            return $byCommune[$commune];
        }

        foreach ($byCommune as $name => $coords) {
            if (strcasecmp($name, $commune) === 0) {
                return $coords;
            }
        }

        return null;
    }
}
