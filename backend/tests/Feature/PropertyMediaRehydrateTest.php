<?php

namespace Tests\Feature;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PropertyMediaRehydrateTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['filesystems.media_disk' => 's3']);
        Storage::fake('s3');
    }

    public function test_rehydrate_links_existing_cloud_objects_by_property_title(): void
    {
        $owner = User::factory()->create();
        $property = Property::factory()->create([
            'owner_id' => $owner->id,
            'title' => 'Villa test rehydrate - Gombe',
        ]);

        $cloudPath = 'properties/99/images/01-cover.jpg';
        Storage::disk('s3')->put($cloudPath, 'image-bytes', 'public');

        $exportRoot = storage_path('app/rehydrate-test');
        File::deleteDirectory($exportRoot);
        File::makeDirectory($exportRoot, 0755, true);

        File::put($exportRoot.'/manifest.json', json_encode([
            'version' => 1,
            'properties' => [
                [
                    'property_title' => 'Villa test rehydrate — Gombe',
                    'source_property_id' => 99,
                    'images' => [
                        [
                            'filename' => '01-cover.jpg',
                            'sort_order' => 1,
                            'source_path' => $cloudPath,
                        ],
                    ],
                ],
            ],
        ], JSON_THROW_ON_ERROR));

        Artisan::call('property-media:rehydrate', [
            'directory' => 'storage/app/rehydrate-test',
        ]);

        $this->assertDatabaseHas('property_images', [
            'property_id' => $property->id,
            'sort_order' => 1,
            'path' => $cloudPath,
        ]);

        $image = PropertyImage::query()->where('property_id', $property->id)->first();
        $this->assertNotNull($image);
        Storage::disk('s3')->assertExists($image->path);

        File::deleteDirectory($exportRoot);
    }
}
