<?php

namespace App\Enums;

enum MobileMoneyProvider: string
{
    case Orange = 'orange';
    case Airtel = 'airtel';
    case Mpesa = 'mpesa';

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    public function label(): string
    {
        return match ($this) {
            self::Orange => 'Orange Money',
            self::Airtel => 'Airtel Money',
            self::Mpesa => 'M-Pesa (Vodacom)',
        };
    }
}
