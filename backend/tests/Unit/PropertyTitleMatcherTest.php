<?php

namespace Tests\Unit;

use App\Support\PropertyTitleMatcher;
use PHPUnit\Framework\TestCase;

class PropertyTitleMatcherTest extends TestCase
{
    public function test_normalize_converts_em_dash_to_hyphen(): void
    {
        $this->assertSame(
            'Appartement moderne - Gombe',
            PropertyTitleMatcher::normalize('Appartement moderne — Gombe'),
        );
    }
}
