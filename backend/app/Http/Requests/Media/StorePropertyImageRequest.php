<?php

namespace App\Http\Requests\Media;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StorePropertyImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('property')) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'mimes:jpeg,png,jpg,webp',
                'mimetypes:image/jpeg,image/png,image/x-png,image/webp',
                'max:10240',
            ],
            'sort_order' => ['sometimes', 'integer', 'min:0', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'image.required' => 'Veuillez sélectionner une image.',
            'image.file' => 'Le fichier envoyé n\'est pas une image valide.',
            'image.mimes' => 'Formats acceptés : JPG, PNG, WebP.',
            'image.mimetypes' => 'Formats acceptés : JPG, PNG, WebP.',
            'image.max' => 'L\'image ne doit pas dépasser 10 Mo.',
            'image.uploaded' => sprintf(
                'Échec du téléversement : limite PHP upload_max_filesize = %s (max app 10 Mo). Relancez l\'API avec .\\scripts\\serve-backend.ps1 (voir README).',
                ini_get('upload_max_filesize') ?: 'inconnue',
            ),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->hasFile('image') || ! $this->isMethod('POST')) {
                return;
            }

            $contentType = (string) $this->header('Content-Type', '');
            if (! str_contains($contentType, 'multipart/form-data')) {
                return;
            }

            if ($validator->errors()->has('image')) {
                return;
            }

            $validator->errors()->add(
                'image',
                sprintf(
                    'Photo non reçue par PHP (upload_max_filesize = %s). Arrêtez le serveur sur le port 8000, relancez avec : .\\scripts\\serve-backend.ps1',
                    ini_get('upload_max_filesize') ?: 'inconnue',
                ),
            );
        });
    }
}
