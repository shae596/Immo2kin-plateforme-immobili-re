<?php

namespace App\Enums;

enum PropertyType: string
{
    case Appartement = 'appartement';
    case Maison = 'maison';
    case Studio = 'studio';
    case Terrain = 'terrain';
    case Bureau = 'bureau';
    case Commerce = 'commerce';
    case Villa = 'villa';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
