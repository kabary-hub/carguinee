/**
 * Règles de photos d'un véhicule.
 *
 * Ces constantes et fonctions pures centralisent la contrainte métier
 * « 1 à 8 photos maximum par véhicule » afin qu'elle soit appliquée de la
 * même façon par le middleware d'upload et par le service, et testable.
 */

/** Nombre maximal de photos autorisées par véhicule (règle stricte). */
export const MAX_PHOTOS_PER_VEHICLE = 8;

/** Taille maximale d'une photo en octets : 2 Mo. */
export const MAX_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;

/** Extensions / types MIME acceptés pour les photos de véhicule. */
export const ALLOWED_PHOTO_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

/** Message d'erreur affiché pour un format de fichier non accepté. */
export const INVALID_PHOTO_TYPE_MESSAGE =
  "Seuls les fichiers JPG, PNG et WEBP sont acceptés.";

/** Message d'erreur affiché quand la limite de 8 photos serait dépassée. */
export const PHOTO_LIMIT_MESSAGE =
  "Un véhicule ne peut pas avoir plus de 8 photos.";

/**
 * Vérifie qu'un type MIME est autorisé pour les photos de véhicule.
 * @param mimeType Type MIME du fichier envoyé.
 */
export function isAllowedPhotoMimeType(mimeType: string): boolean {
  return ALLOWED_PHOTO_MIME_TYPES.has(mimeType);
}

/**
 * Calcule le nombre de photos encore ajoutables pour un véhicule.
 * @param currentCount Nombre de photos actuellement enregistrées.
 */
export function remainingPhotoSlots(currentCount: number): number {
  return Math.max(0, MAX_PHOTOS_PER_VEHICLE - currentCount);
}

/**
 * Vérifie que l'ajout de `incomingCount` photos ne dépasse pas la limite.
 * @param currentCount Nombre de photos déjà enregistrées.
 * @param incomingCount Nombre de photos à ajouter dans la même requête.
 * @returns `true` si l'ajout respecte la limite des 8 photos.
 */
export function canAddPhotos(currentCount: number, incomingCount: number): boolean {
  return currentCount + incomingCount <= MAX_PHOTOS_PER_VEHICLE;
}

/**
 * Renvoie le message d'erreur à afficher si l'ajout dépasse la limite,
 * ou `null` si l'ajout est autorisé.
 * @param currentCount Nombre de photos déjà enregistrées.
 * @param incomingCount Nombre de photos à ajouter dans la même requête.
 */
export function photoLimitError(
  currentCount: number,
  incomingCount: number,
): string | null {
  if (incomingCount <= 0) {
    return "Au moins une photo est requise.";
  }

  if (!canAddPhotos(currentCount, incomingCount)) {
    return PHOTO_LIMIT_MESSAGE;
  }

  return null;
}
