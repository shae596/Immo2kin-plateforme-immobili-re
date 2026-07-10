<?php

namespace App\Enums;

enum RecommendationEventType: string
{
    case View = 'view';
    case Favorite = 'favorite';
    case Unfavorite = 'unfavorite';
    case Search = 'search';
    case Reservation = 'reservation';
    case Review = 'review';

    public function weight(): int
    {
        return match ($this) {
            self::Favorite => 5,
            self::Reservation => 4,
            self::Review => 3,
            self::View => 1,
            self::Search => 2,
            self::Unfavorite => -2,
        };
    }
}
