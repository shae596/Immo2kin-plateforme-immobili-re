<?php

namespace App\Support;

use App\Models\Property;

final class PropertyTitleMatcher
{
    public static function normalize(string $title): string
    {
        $title = str_replace(["\u{2014}", "\u{2013}", '—', '–', '−'], '-', $title);
        $title = preg_replace('/\s+/u', ' ', trim($title)) ?? trim($title);

        return $title;
    }

    public static function findByTitle(string $title): ?Property
    {
        $needle = self::normalize($title);

        foreach (Property::query()->cursor() as $property) {
            if (self::normalize($property->title) === $needle) {
                return $property;
            }
        }

        return null;
    }
}
