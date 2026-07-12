<?php

namespace App\Console\Commands;

use App\Models\PropertyImage;
use App\Support\MediaStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class SyncPropertyMediaToCloudCommand extends Command
{
    protected $signature = 'property-media:sync-cloud
                            {--from=public : Disque source (local)}
                            {--dry-run : Liste les fichiers sans les copier}';

    protected $description = 'Copie les fichiers médias locaux vers le disque cloud (S3/R2), en conservant les chemins';

    public function handle(): int
    {
        $targetDisk = MediaStorage::diskName();
        $sourceDisk = (string) $this->option('from');

        if ($targetDisk === $sourceDisk) {
            $this->error("Le disque cible ({$targetDisk}) est identique au disque source.");

            return self::FAILURE;
        }

        if ($targetDisk !== 's3') {
            $this->error('MEDIA_DISK doit être « s3 » pour synchroniser vers le cloud.');
            $this->line('Définissez MEDIA_DISK=s3 et les variables AWS_* / R2 dans .env');

            return self::FAILURE;
        }

        $dryRun = (bool) $this->option('dry-run');
        $uploaded = 0;
        $skipped = 0;

        PropertyImage::query()
            ->orderBy('property_id')
            ->orderBy('sort_order')
            ->each(function (PropertyImage $image) use ($sourceDisk, $dryRun, &$uploaded, &$skipped): void {
                $path = $image->path;

                if (MediaStorage::safeExists(MediaStorage::disk(), $path)) {
                    $skipped++;

                    return;
                }

                if (! MediaStorage::safeExists(Storage::disk($sourceDisk), $path)) {
                    $this->warn("Source manquante : {$path}");
                    $skipped++;

                    return;
                }

                $this->line(($dryRun ? '[dry-run] ' : '')."Upload : {$path}");

                if (! $dryRun) {
                    MediaStorage::disk()->put(
                        $path,
                        Storage::disk($sourceDisk)->get($path),
                        'public',
                    );
                }

                $uploaded++;
            });

        $this->info($dryRun
            ? "Simulation : {$uploaded} fichier(s) seraient envoyés, {$skipped} ignoré(s)."
            : "Sync terminée : {$uploaded} fichier(s) envoyé(s), {$skipped} ignoré(s).");

        return self::SUCCESS;
    }
}
