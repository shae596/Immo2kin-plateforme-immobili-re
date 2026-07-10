<?php

namespace App\Support;

class PhoneNormalizer
{
    /**
     * Normalise un numéro vers le format international RDC (+243…).
     */
    public static function normalize(?string $phone): ?string
    {
        if ($phone === null) {
            return null;
        }

        $trimmed = trim($phone);
        if ($trimmed === '') {
            return null;
        }

        $digits = preg_replace('/\D/', '', $trimmed) ?? '';
        if ($digits === '') {
            return null;
        }

        // 0XXXXXXXXX (local RDC) → 243XXXXXXXXX
        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            $digits = '243'.substr($digits, 1);
        }

        // 9 chiffres sans indicatif → 243…
        if (strlen($digits) === 9 && ! str_starts_with($digits, '243')) {
            $digits = '243'.$digits;
        }

        return '+'.$digits;
    }
}
