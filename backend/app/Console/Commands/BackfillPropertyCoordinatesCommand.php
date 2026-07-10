<?php

namespace App\Console\Commands;

use App\Models\Property;
use App\Support\KinshasaCommuneCoordinates;
use Illuminate\Console\Command;

class BackfillPropertyCoordinatesCommand extends Command
{
    protected $signature = 'properties:backfill-coordinates {--dry-run : Affiche les mises à jour sans les appliquer}';

    protected $description = 'Renseigne latitude/longitude des annonces à partir de la commune (Kinshasa)';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $updated = 0;

        Property::query()
            ->where(function ($query): void {
                $query->whereNull('latitude')->orWhereNull('longitude');
            })
            ->orderBy('id')
            ->each(function (Property $property) use ($dryRun, &$updated): void {
                $coords = KinshasaCommuneCoordinates::forCommune($property->commune);

                if ($coords === null) {
                    $this->warn("Annonce #{$property->id} ({$property->commune}) : commune non reconnue, ignorée.");

                    return;
                }

                $this->line("Annonce #{$property->id} « {$property->title} » → {$coords['latitude']}, {$coords['longitude']}");

                if (! $dryRun) {
                    $property->update($coords);
                }

                $updated++;
            });

        $this->info($dryRun
            ? "{$updated} annonce(s) seraient mises à jour. Relancez sans --dry-run pour appliquer."
            : "{$updated} annonce(s) géolocalisée(s).");

        return self::SUCCESS;
    }
}
