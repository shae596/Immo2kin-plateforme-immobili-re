<?php

namespace App\Enums;

enum UserRole: string
{
    case Client = 'client';
    case Proprietaire = 'proprietaire';
    case Agence = 'agence';
    case Admin = 'admin';

    /** @return list<string> */
    public static function selfAssignable(): array
    {
        return [
            self::Client->value,
            self::Proprietaire->value,
            self::Agence->value,
        ];
    }
}
