<?php

namespace App\Services;

use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\PropertyVideo;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PropertyMediaService
{
    private const IMAGE_MIMES = [
        'image/jpeg',
        'image/png',
        'image/x-png',
        'image/webp',
        'image/jpg',
    ];

    private const VIDEO_MIMES = ['video/mp4', 'video/webm'];

    public function storeImage(Property $property, UploadedFile $file, int $sortOrder = 0): PropertyImage
    {
        $path = $this->storeFile($property, $file, 'images');

        return PropertyImage::query()->create([
            'property_id' => $property->id,
            'path' => $path,
            'sort_order' => $sortOrder,
        ]);
    }

    public function storeVideo(Property $property, UploadedFile $file): PropertyVideo
    {
        $path = $this->storeFile($property, $file, 'videos');

        return PropertyVideo::query()->create([
            'property_id' => $property->id,
            'path' => $path,
        ]);
    }

    public function deleteImage(PropertyImage $image): void
    {
        Storage::disk('public')->delete($image->path);
        $image->delete();
    }

    public function deleteVideo(PropertyVideo $video): void
    {
        Storage::disk('public')->delete($video->path);
        $video->delete();
    }

    /** @return list<string> */
    public static function allowedImageMimes(): array
    {
        return self::IMAGE_MIMES;
    }

    /** @return list<string> */
    public static function allowedVideoMimes(): array
    {
        return self::VIDEO_MIMES;
    }

    private function storeFile(Property $property, UploadedFile $file, string $folder): string
    {
        $extension = $file->guessExtension() ?? 'bin';
        $filename = Str::uuid()->toString().'.'.$extension;

        return $file->storeAs(
            "properties/{$property->id}/{$folder}",
            $filename,
            'public',
        );
    }
}
