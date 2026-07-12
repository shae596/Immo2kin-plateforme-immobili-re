<?php

namespace App\Console\Commands;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Support\MediaStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ImportPropertyMediaCommand extends Command
{
    protected $signature = 'property-media:import
                            {directory=storage/app/media-export : Dossier d\'import (relatif à backend/)}
                            {--dry-run : Simule sans écrire fichiers ni base}
                            {--replace : Supprime les images existantes des annonces ciblées}';

    protected $description = 'Importe les images depuis un export (rattachement par titre d\'annonce, ordre préservé)';

    public function handle(): int
    {
        $importRoot = base_path($this->argument('directory'));
        $manifestPath = $importRoot.'/manifest.json';
        $filesRoot = $importRoot.'/files';

        if (! File::isFile($manifestPath)) {
            $this->error("Manifeste introuvable : {$manifestPath}");
            $this->line('Lancez d\'abord : php artisan property-media:export');

            return self::FAILURE;
        }

        /** @var array{version?: int, properties?: list<array<string, mixed>>} $manifest */
        $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);

        $dryRun = (bool) $this->option('dry-run');
        $replace = (bool) $this->option('replace');
        $imported = 0;
        $skipped = 0;

        foreach ($manifest['properties'] ?? [] as $entry) {
            $title = (string) ($entry['property_title'] ?? '');
            if ($title === '') {
                continue;
            }

            $property = Property::query()->where('title', $title)->first();
            if ($property === null) {
                $this->warn("Annonce introuvable : « {$title} »");
                $skipped++;

                continue;
            }

            if ($replace && ! $dryRun) {
                $property->images()->each(function (PropertyImage $image): void {
                    MediaStorage::disk()->delete($image->path);
                    $image->delete();
                });
            }

            foreach ($entry['images'] ?? [] as $imageEntry) {
                $filename = (string) ($imageEntry['filename'] ?? '');
                $sortOrder = (int) ($imageEntry['sort_order'] ?? 0);
                $sourcePath = (string) ($imageEntry['source_path'] ?? '');

                if ($filename === '') {
                    continue;
                }

                $localFile = $filesRoot.'/'.ltrim(str_replace('\\', '/', $sourcePath), '/');
                if (! File::isFile($localFile)) {
                    $localFile = $filesRoot.'/properties/'.($entry['source_property_id'] ?? 0).'/images/'.$filename;
                }

                if (! File::isFile($localFile)) {
                    $this->warn("Fichier manquant pour « {$title} » : {$filename}");
                    $skipped++;

                    continue;
                }

                $targetPath = "properties/{$property->id}/images/{$filename}";

                $already = PropertyImage::query()
                    ->where('property_id', $property->id)
                    ->where('sort_order', $sortOrder)
                    ->exists();

                if ($already && ! $replace) {
                    $this->line("SKIP (déjà présent) : {$title} [{$sortOrder}]");
                    $skipped++;

                    continue;
                }

                $this->line(($dryRun ? '[dry-run] ' : '')."OK : « {$title} » [{$sortOrder}] ← {$filename}");

                if (! $dryRun) {
                    MediaStorage::disk()->put(
                        $targetPath,
                        File::get($localFile),
                        'public',
                    );

                    PropertyImage::query()->updateOrCreate(
                        [
                            'property_id' => $property->id,
                            'sort_order' => $sortOrder,
                        ],
                        ['path' => $targetPath],
                    );
                }

                $imported++;
            }
        }

        $this->info($dryRun
            ? "Simulation : {$imported} image(s) seraient importées, {$skipped} ignorée(s)."
            : "Import terminé : {$imported} image(s), {$skipped} ignorée(s).");

        return self::SUCCESS;
    }
}
