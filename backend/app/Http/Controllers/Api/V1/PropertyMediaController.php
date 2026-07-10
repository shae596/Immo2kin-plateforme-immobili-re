<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\StorePropertyImageRequest;
use App\Http\Requests\Media\StorePropertyVideoRequest;
use App\Http\Resources\PropertyImageResource;
use App\Http\Resources\PropertyVideoResource;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Models\PropertyVideo;
use App\Services\PropertyMediaService;
use Illuminate\Http\JsonResponse;

class PropertyMediaController extends Controller
{
    public function __construct(
        private readonly PropertyMediaService $media,
    ) {}

    public function storeImage(StorePropertyImageRequest $request, Property $property): JsonResponse
    {
        $image = $this->media->storeImage(
            $property,
            $request->file('image'),
            (int) $request->input('sort_order', 0),
        );

        return response()->json([
            'message' => 'Image ajoutée.',
            'image' => new PropertyImageResource($image),
        ], 201);
    }

    public function destroyImage(Property $property, PropertyImage $image): JsonResponse
    {
        $this->authorize('update', $property);
        abort_unless($image->property_id === $property->id, 404);

        $this->media->deleteImage($image);

        return response()->json([
            'message' => 'Image supprimée.',
        ]);
    }

    public function storeVideo(StorePropertyVideoRequest $request, Property $property): JsonResponse
    {
        $video = $this->media->storeVideo(
            $property,
            $request->file('video'),
        );

        return response()->json([
            'message' => 'Vidéo ajoutée.',
            'video' => new PropertyVideoResource($video),
        ], 201);
    }

    public function destroyVideo(Property $property, PropertyVideo $video): JsonResponse
    {
        $this->authorize('update', $property);
        abort_unless($video->property_id === $property->id, 404);

        $this->media->deleteVideo($video);

        return response()->json([
            'message' => 'Vidéo supprimée.',
        ]);
    }
}
