<?php

use App\Models\Property;
use App\Models\PropertyImage;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== Images par annonce ===\n";
foreach (Property::query()->with('images')->orderBy('id')->get() as $p) {
    echo "\n#{$p->id} | {$p->title} | {$p->listing_type->value} | {$p->status->value}\n";
    foreach ($p->images as $img) {
        echo "  [{$img->sort_order}] {$img->path}\n";
    }
}
