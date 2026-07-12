<?php

namespace App\Console\Commands;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Support\MediaStorage;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class ExportPropertyMediaCommand extends Command
{
    protected $signature = 'property-media:export
                            {directory=storage/app/media-export : Dossier de sortie (relatif à backend/)}';

    protected $description = 'Exporte les images d\'annonces (fichiers + manifeste JSON avec ordre)';

    public function handle(): int
    {
        $exportRoot = base_path($this->argument('directory'));
        $filesRoot = $exportRoot.'/files';

        if (File::isDirectory($exportRoot)) {
            File::deleteDirectory($exportRoot);
        }

        File::makeDirectory($filesRoot, 0755, true);

        $disk = MediaStorage::diskName();
        $properties = Property::query()
            ->with(['images' => fn ($q) => $q->orderBy('sort_order')])
            ->whereHas('images')
            ->orderBy('id')
            ->get();

        $manifest = [
            'version' => 1,
            'exported_at' => now()->toIso8601String(),
            'source_disk' => $disk,
            'properties' => [],
        ];

        $copied = 0;

        foreach ($properties as $property) {
            $entry = [
                'property_title' => $property->title,
                'source_property_id' => $property->id,
                'images' => [],
            ];

            foreach ($property->images as $image) {
                if (! MediaStorage::disk()->exists($image->path)) {
                    $this->warn("Fichier manquant (#{$property->id}): {$image->path}");

                    continue;
                }

                $target = $filesRoot.'/'.$image->path;
                File::ensureDirectoryExists(dirname($target));

                $contents = MediaStorage::disk()->get($image->path);
                File::put($target, $contents);

                $entry['images'][] = [
                    'filename' => basename($image->path),
                    'sort_order' => $image->sort_order,
                    'source_path' => $image->path,
                ];
                $copied++;
            }

            if ($entry['images'] !== []) {
                $manifest['properties'][] = $entry;
            }
        }

        File::put(
            $exportRoot.'/manifest.json',
            json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)."\n",
        );

        $this->info("Export terminé : {$copied} fichier(s) dans {$exportRoot}");
        $this->line('Manifeste : '.$exportRoot.'/manifest.json');

        return self::SUCCESS;
    }
}
