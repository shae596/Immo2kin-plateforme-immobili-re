<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PropertyMediaImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_restores_images_by_title_with_sort_order(): void
    {
        Storage::fake('public');

        $owner = User::factory()->create();
        $property = Property::factory()->create([
            'owner_id' => $owner->id,
            'title' => 'Villa test import — Gombe',
        ]);

        $exportRoot = storage_path('app/media-export-test');
        $filesRoot = $exportRoot.'/files';

        File::deleteDirectory($exportRoot);
        File::makeDirectory($filesRoot.'/properties/99/images', 0755, true);

        $imageBytes = UploadedFile::fake()->image('cover.jpg')->getContent();
        File::put($filesRoot.'/properties/99/images/01-cover.jpg', $imageBytes);

        File::put($exportRoot.'/manifest.json', json_encode([
            'version' => 1,
            'properties' => [
                [
                    'property_title' => 'Villa test import — Gombe',
                    'source_property_id' => 99,
                    'images' => [
                        [
                            'filename' => '01-cover.jpg',
                            'sort_order' => 1,
                            'source_path' => 'properties/99/images/01-cover.jpg',
                        ],
                    ],
                ],
            ],
        ], JSON_THROW_ON_ERROR));

        Artisan::call('property-media:import', [
            'directory' => 'storage/app/media-export-test',
        ]);

        $this->assertDatabaseHas('property_images', [
            'property_id' => $property->id,
            'sort_order' => 1,
        ]);

        $image = PropertyImage::query()->where('property_id', $property->id)->first();
        $this->assertNotNull($image);
        $this->assertStringContainsString("properties/{$property->id}/images/01-cover.jpg", $image->path);
        Storage::disk('public')->assertExists($image->path);

        File::deleteDirectory($exportRoot);
    }
}
