import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ConfirmDialog } from '../components/ConfirmDialog'
import {
  createProperty,
  deletePropertyImage,
  fetchAmenities,
  updateProperty,
  uploadPropertyImage,
} from '../services/api/properties'
import type {
  Amenity,
  CreatePropertyPayload,
  Property,
  PropertyImage,
  ListingType,
  PropertyStatus,
  PropertyType,
} from '../types/property'
import { LISTING_TYPES, PROPERTY_STATUS_OPTIONS, PROPERTY_TYPES } from '../types/property'
import { getApiErrorMessage, getApiFieldErrors } from '../utils/apiErrors'
import {
  formatFileSize,
  PROPERTY_IMAGE_ACCEPT,
  validatePropertyImageFiles,
} from '../utils/propertyImages'

interface PropertyFormPageProps {
  property?: Property
}

export function PropertyFormPage({ property }: PropertyFormPageProps) {
  const navigate = useNavigate()
  const isEdit = Boolean(property)

  const [amenities, setAmenities] = useState<Amenity[]>([])
  const [title, setTitle] = useState(property?.title ?? '')
  const [description, setDescription] = useState(property?.description ?? '')
  const [status, setStatus] = useState<PropertyStatus>(
    property?.status ?? 'draft',
  )
  const [price, setPrice] = useState(property?.price ?? '')
  const [city, setCity] = useState(property?.city ?? 'Kinshasa')
  const [commune, setCommune] = useState(property?.commune ?? '')
  const [address, setAddress] = useState(property?.address ?? '')
  const [rooms, setRooms] = useState(property?.rooms?.toString() ?? '')
  const [bathrooms, setBathrooms] = useState(property?.bathrooms?.toString() ?? '')
  const [area, setArea] = useState(property?.area ?? '')
  const [type, setType] = useState<PropertyType>(
    property?.type ?? 'appartement',
  )
  const [listingType, setListingType] = useState<ListingType>(
    property?.listing_type ?? 'rent',
  )
  const [hasKitchen, setHasKitchen] = useState(property?.has_kitchen ?? false)
  const [hasLivingRoom, setHasLivingRoom] = useState(
    property?.has_living_room ?? false,
  )
  const [hasStore, setHasStore] = useState(property?.has_store ?? false)
  const [selectedAmenities, setSelectedAmenities] = useState<number[]>(
    property?.amenities?.map((a) => a.id) ?? [],
  )
  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<PropertyImage[]>(
    () => [...(property?.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  )
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null)
  const [imageToDelete, setImageToDelete] = useState<PropertyImage | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchAmenities().then(setAmenities).catch(() => {})
  }, [])

  useEffect(() => {
    setExistingImages(
      [...(property?.images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    )
  }, [property])

  async function confirmDeleteExistingImage() {
    if (!property || !imageToDelete) return

    setFormError(null)
    setDeletingImageId(imageToDelete.id)
    try {
      await deletePropertyImage(property.id, imageToDelete.id)
      setExistingImages((prev) => prev.filter((img) => img.id !== imageToDelete.id))
      setImageToDelete(null)
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Suppression de la photo impossible.'))
    } finally {
      setDeletingImageId(null)
    }
  }

  function toggleAmenity(id: number) {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id],
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setSubmitting(true)

    const submitter = (event.nativeEvent as SubmitEvent).submitter as
      | HTMLButtonElement
      | undefined
    const submitAction = submitter?.value as PropertyStatus | 'save' | undefined
    const finalStatus: PropertyStatus =
      submitAction === 'draft' || submitAction === 'published'
        ? submitAction
        : status

    const imageValidationError = validatePropertyImageFiles(images)
    if (imageValidationError !== null) {
      setFormError(imageValidationError)
      setSubmitting(false)
      return
    }

    const payload: CreatePropertyPayload = {
      title,
      description: description || undefined,
      status: finalStatus,
      price: Number(price),
      city,
      commune,
      address: address || undefined,
      rooms: rooms ? Number(rooms) : undefined,
      bathrooms: bathrooms ? Number(bathrooms) : undefined,
      area: area ? Number(area) : undefined,
      has_kitchen: hasKitchen,
      has_living_room: hasLivingRoom,
      has_store: hasStore,
      type,
      listing_type: listingType,
      amenity_ids: selectedAmenities,
    }

    try {
      let saved: Property
      if (isEdit && property) {
        saved = await updateProperty(property.id, payload)
      } else {
        saved = await createProperty(payload)
      }

      const sortOffset = isEdit ? existingImages.length : 0
      for (const [index, file] of images.entries()) {
        try {
          await uploadPropertyImage(saved.id, file, sortOffset + index)
        } catch (uploadError) {
          const detail = getApiErrorMessage(
            uploadError,
            'Format ou taille de fichier refusé.',
          )
          setFormError(
            `Annonce enregistrée, mais la photo « ${file.name} » n'a pas pu être ajoutée : ${detail}`,
          )
          setSubmitting(false)
          navigate(`/my/properties/${saved.id}/edit`, { replace: true })
          return
        }
      }

      navigate(finalStatus === 'published' ? `/properties/${saved.id}` : '/my/properties')
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Enregistrement impossible.'))
      setFieldErrors(getApiFieldErrors(error))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">
        {isEdit ? 'Modifier l\'annonce' : 'Nouvelle annonce'}
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-lg border border-slate-200 bg-white p-6"
      >
        {formError && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="title" className="mb-1 block text-sm font-medium">
            Titre *
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          {fieldErrors.title?.[0] && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.title[0]}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="mb-1 block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="type" className="mb-1 block text-sm font-medium">
              Type *
            </label>
            <select
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value as PropertyType)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="listing-type" className="mb-1 block text-sm font-medium">
              Transaction
            </label>
            <select
              id="listing-type"
              value={listingType}
              onChange={(e) => setListingType(e.target.value as ListingType)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              {LISTING_TYPES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-semibold text-slate-900">Visibilité de l&apos;annonce</h2>
          <p className="mt-1 text-xs text-slate-600">
            Choisissez si les clients peuvent voir cette annonce dans le catalogue public.
          </p>
          <fieldset className="mt-3 space-y-2">
            <legend className="sr-only">Statut de publication</legend>
            {PROPERTY_STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`flex cursor-pointer gap-3 rounded-md border p-3 transition ${
                  status === option.value
                    ? 'border-emerald-600 bg-white ring-1 ring-emerald-600'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <input
                  type="radio"
                  name="property-status"
                  value={option.value}
                  checked={status === option.value}
                  onChange={() => setStatus(option.value)}
                  className="mt-0.5"
                />
                <span>
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-xs text-slate-600">{option.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>

        <fieldset className="space-y-2 rounded-md border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium">Pièces & espaces</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasLivingRoom}
              onChange={(e) => setHasLivingRoom(e.target.checked)}
            />
            Salon / séjour
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasKitchen}
              onChange={(e) => setHasKitchen(e.target.checked)}
            />
            Cuisine
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hasStore}
              onChange={(e) => setHasStore(e.target.checked)}
            />
            Débarras / réserve
          </label>
        </fieldset>

        <div>
          <label htmlFor="price" className="mb-1 block text-sm font-medium">
            Prix (USD) *
          </label>
          <input
            id="price"
            type="number"
            min={0}
            required
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="city" className="mb-1 block text-sm font-medium">
              Ville *
            </label>
            <input
              id="city"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="commune" className="mb-1 block text-sm font-medium">
              Commune *
            </label>
            <input
              id="commune"
              required
              value={commune}
              onChange={(e) => setCommune(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label htmlFor="address" className="mb-1 block text-sm font-medium">
            Adresse
          </label>
          <input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="rooms" className="mb-1 block text-sm font-medium">
              Chambres
            </label>
            <input
              id="rooms"
              type="number"
              min={0}
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="bathrooms" className="mb-1 block text-sm font-medium">
              Salles de bain
            </label>
            <input
              id="bathrooms"
              type="number"
              min={0}
              value={bathrooms}
              onChange={(e) => setBathrooms(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="area" className="mb-1 block text-sm font-medium">
              Surface (m²)
            </label>
            <input
              id="area"
              type="number"
              min={0}
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {amenities.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Équipements</p>
            <div className="flex flex-wrap gap-2">
              {amenities.map((a) => (
                <label
                  key={a.id}
                  className={`cursor-pointer rounded-full border px-3 py-1 text-sm ${
                    selectedAmenities.includes(a.id)
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                      : 'border-slate-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selectedAmenities.includes(a.id)}
                    onChange={() => toggleAmenity(a.id)}
                  />
                  {a.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="images" className="mb-1 block text-sm font-medium">
            Photos
          </label>
          {isEdit && existingImages.length > 0 && (
            <div className="mb-4">
              <p className="mb-2 text-xs text-slate-600">Photos actuelles</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {existingImages.map((image) => (
                  <div key={image.id} className="group relative overflow-hidden rounded-lg">
                    <img
                      src={image.url}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setImageToDelete(image)}
                      disabled={deletingImageId === image.id || submitting}
                      className="absolute right-2 top-2 rounded-md bg-red-600/90 px-2 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    >
                      {deletingImageId === image.id ? 'Suppression…' : 'Supprimer'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <p className="mb-2 text-xs text-slate-500">
            {isEdit ? 'Ajouter des photos' : 'Photos'} — JPG, PNG ou WebP, maximum 10 Mo par fichier.
          </p>
          <input
            id="images"
            type="file"
            accept={PROPERTY_IMAGE_ACCEPT}
            multiple
            onChange={(e) => setImages(Array.from(e.target.files ?? []))}
            className="w-full text-sm"
          />
          {images.length > 0 && (
            <ul className="mt-2 space-y-1 text-xs text-slate-600">
              {images.map((file) => (
                <li key={`${file.name}-${file.size}`}>
                  {file.name} ({formatFileSize(file.size)})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          {!isEdit ? (
            <>
              <button
                type="submit"
                name="submit-action"
                value="draft"
                disabled={submitting}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
              >
                {submitting ? 'Enregistrement…' : 'Enregistrer en brouillon'}
              </button>
              <button
                type="submit"
                name="submit-action"
                value="published"
                disabled={submitting}
                className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {submitting ? 'Publication…' : 'Publier l\'annonce'}
              </button>
            </>
          ) : (
            <button
              type="submit"
              name="submit-action"
              value="save"
              disabled={submitting}
              className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {submitting ? 'Enregistrement…' : 'Enregistrer les modifications'}
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm"
          >
            Annuler
          </button>
        </div>
      </form>

      <ConfirmDialog
        open={imageToDelete !== null}
        title="Supprimer la photo"
        message="Voulez-vous supprimer cette photo de l'annonce ? Cette action est irréversible."
        confirmLabel="Supprimer"
        variant="danger"
        busy={deletingImageId !== null}
        busyLabel="Suppression…"
        onConfirm={() => void confirmDeleteExistingImage()}
        onCancel={() => {
          if (deletingImageId === null) setImageToDelete(null)
        }}
      />
    </div>
  )
}
