<?php

/**
 * Restaure les liens property_images depuis les fichiers sur disque
 * (apres un db:seed qui a supprime les enregistrements mais pas les fichiers).
 */

use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Support\Facades\File;

require __DIR__.'/../vendor/autoload.php';
$app = require __DIR__.'/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$titlesByLegacyFolder = [
    10 => 'Appartement moderne — Gombe',
    11 => 'Maison familiale — Bandalungwa',
    12 => 'Studio meublé — Lingwala',
    13 => 'Bureau commercial — Gombe (brouillon)',
    14 => 'Villa à vendre — Ngaliema',
    15 => 'Appartement 2 chambres — Limete',
    16 => 'Maison avec jardin — Kalamu',
    17 => 'Local commercial — Gombe',
];

$extraFolders = [
    9 => 'Appartement moderne — Gombe',
];

$allFolders = $extraFolders + $titlesByLegacyFolder;
$restored = 0;

foreach ($allFolders as $legacyId => $title) {
    $property = Property::query()->where('title', $title)->first();
    if ($property === null) {
        echo "SKIP (annonce introuvable): {$title}\n";
        continue;
    }

    $imageDir = storage_path("app/public/properties/{$legacyId}/images");
    if (! File::isDirectory($imageDir)) {
        echo "SKIP (dossier vide): {$legacyId} -> {$title}\n";
        continue;
    }

    $files = collect(File::files($imageDir))->sortBy(fn ($f) => $f->getFilename())->values();
    $sort = (int) PropertyImage::query()->where('property_id', $property->id)->max('sort_order');

    foreach ($files as $file) {
        $relative = "properties/{$legacyId}/images/".$file->getFilename();

        $exists = PropertyImage::query()
            ->where('property_id', $property->id)
            ->where('path', $relative)
            ->exists();

        if ($exists) {
            continue;
        }

        $sort++;
        PropertyImage::query()->create([
            'property_id' => $property->id,
            'path' => $relative,
            'sort_order' => $sort,
        ]);
        $restored++;
        echo "OK: {$title} <- {$relative}\n";
    }
}

echo "\nTotal images restaurees: {$restored}\n";
