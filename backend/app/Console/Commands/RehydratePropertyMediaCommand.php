<?php

namespace App\Console\Commands;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Support\MediaStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class RehydratePropertyMediaCommand extends Command
{
    protected $signature = 'property-media:rehydrate
                            {directory=deploy/property-media : Dossier contenant manifest.json}
                            {--dry-run : Simule sans écrire en base}
                            {--bundle= : Dossier files/ local (fallback si objet cloud absent)}';

    protected $description = 'Rattache les photos déjà sur le cloud (R2/S3) aux annonces Railway via manifest.json (par titre)';

    public function handle(): int
    {
        $importRoot = $this->resolveDirectory($this->argument('directory'));
        $manifestPath = $importRoot.'/manifest.json';

        if (! File::isFile($manifestPath)) {
            $this->error("Manifeste introuvable : {$manifestPath}");

            return self::FAILURE;
        }

        $diskName = MediaStorage::diskName();
        if ($diskName !== 's3') {
            $this->error("MEDIA_DISK doit être « s3 » (actuel : {$diskName}).");

            return self::FAILURE;
        }

        /** @var array{properties?: list<array<string, mixed>>} $manifest */
        $manifest = json_decode(File::get($manifestPath), true, 512, JSON_THROW_ON_ERROR);

        $disk = MediaStorage::disk();
        $bundleRoot = $this->option('bundle') !== null
            ? $this->resolveDirectory((string) $this->option('bundle')).'/files'
            : $importRoot.'/files';
        $dryRun = (bool) $this->option('dry-run');
        $linked = 0;
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

            foreach ($entry['images'] ?? [] as $imageEntry) {
                $filename = (string) ($imageEntry['filename'] ?? '');
                $sortOrder = (int) ($imageEntry['sort_order'] ?? 0);
                $sourcePath = (string) ($imageEntry['source_path'] ?? '');

                if ($filename === '' || $sourcePath === '') {
                    continue;
                }

                $existing = PropertyImage::query()
                    ->where('property_id', $property->id)
                    ->where('sort_order', $sortOrder)
                    ->first();

                if ($existing !== null && $disk->exists($existing->path)) {
                    $this->line("SKIP (déjà lié) : « {$title} » [{$sortOrder}]");
                    $skipped++;

                    continue;
                }

                $cloudPath = $this->resolveCloudPath(
                    $disk,
                    $sourcePath,
                    $property->id,
                    $filename,
                    $bundleRoot,
                    $entry,
                    $dryRun,
                );

                if ($cloudPath === null) {
                    $this->warn("Fichier introuvable (cloud + bundle) : « {$title} » → {$sourcePath}");
                    $skipped++;

                    continue;
                }

                $this->line(($dryRun ? '[dry-run] ' : '')."OK : « {$title} » [{$sortOrder}] ← {$cloudPath}");

                if (! $dryRun) {
                    PropertyImage::query()->updateOrCreate(
                        [
                            'property_id' => $property->id,
                            'sort_order' => $sortOrder,
                        ],
                        ['path' => $cloudPath],
                    );
                }

                $linked++;
            }
        }

        $this->info($dryRun
            ? "Simulation : {$linked} image(s) seraient liées, {$skipped} ignorée(s)."
            : "Rehydrate terminé : {$linked} image(s) liée(s), {$skipped} ignorée(s).");

        return self::SUCCESS;
    }

    /**
     * Retourne le chemin cloud à enregistrer en base, ou null si introuvable.
     */
    private function resolveCloudPath(
        \Illuminate\Contracts\Filesystem\Filesystem $disk,
        string $sourcePath,
        int $propertyId,
        string $filename,
        string $bundleRoot,
        array $entry,
        bool $dryRun,
    ): ?string {
        if ($disk->exists($sourcePath)) {
            return $sourcePath;
        }

        $targetPath = "properties/{$propertyId}/images/{$filename}";

        if ($disk->exists($targetPath)) {
            return $targetPath;
        }

        $localFile = $bundleRoot.'/'.ltrim(str_replace('\\', '/', $sourcePath), '/');
        if (! File::isFile($localFile)) {
            $localFile = $bundleRoot.'/properties/'.($entry['source_property_id'] ?? 0).'/images/'.$filename;
        }

        if (! File::isFile($localFile)) {
            return null;
        }

        if ($dryRun) {
            return $targetPath;
        }

        $disk->put($targetPath, File::get($localFile), 'public');

        return $targetPath;
    }

    private function resolveDirectory(string $directory): string
    {
        if (str_starts_with($directory, '/')) {
            return rtrim($directory, '/');
        }

        $fromBackend = base_path($directory);
        if (File::isDirectory($fromBackend) || File::isFile($fromBackend.'/manifest.json')) {
            return $fromBackend;
        }

        $fromRoot = base_path('../'.$directory);

        return rtrim($fromRoot, '/');
    }
}
