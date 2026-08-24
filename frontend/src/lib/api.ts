const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

export type ApiError = Error & {
  status?: number;
};

/**
 * Récupère le token JWT stocké côté client.
 * Le serveur place aussi le JWT dans un cookie httpOnly, mais ce cookie
 * n'est pas envoyé par les requêtes fetch cross-origin (même avec
 * credentials: "include") si sameSite !== "none". On utilise donc
 * le token stocké pour construire le header Authorization.
 */
export function getStoredToken() {
  return localStorage.getItem("carguinee_access_token");
}

/** Stocke le token JWT côté client (complément du cookie httpOnly). */
export function storeToken(token: string) {
  localStorage.setItem("carguinee_access_token", token);
}

/** Supprime le token stocké côté client (déconnexion). */
export function clearStoredToken() {
  localStorage.removeItem("carguinee_access_token");
}

/**
 * Résout l'URL d'affichage d'une photo.
 * - Les photos de démonstration (`/demo-vehicles/...`) sont servies par le
 *   frontend lui-même : on les laisse telles quelles.
 * - Les photos téléversées (`/uploads/...`) sont servies par l'API backend :
 *   on préfixe avec l'adresse de l'API pour que le navigateur les charge.
 */
export function resolvePhotoUrl(url: string): string {
  if (url.startsWith("/uploads/")) {
    return `${API_URL}${url}`;
  }
  return url;
}

/**
 * Appel API générique pour les échanges JSON.
 * Attention : ce helper force `Content-Type: application/json`, il ne doit
 * donc pas être utilisé pour les uploads multipart (voir uploadVehiclePhotos).
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message ?? "Une erreur est survenue.") as ApiError;
    error.status = response.status;
    throw error;
  }

  return payload as T;
}

/**
 * Téléverse les photos d'un véhicule (multipart, 1 à 8 fichiers).
 * Le `Content-Type` n'est pas fixé manuellement : le navigateur ajoute
 * automatiquement la frontière multipart nécessaire au bon décodage.
 * Retourne le nombre de photos enregistrées et le nouveau statut du véhicule.
 */
export async function uploadVehiclePhotos(
  vehicleId: string,
  files: File[],
): Promise<{ count: number; vehicleId: string; publicationStatus?: string }> {
  const token = getStoredToken();
  const formData = new FormData();

  for (const file of files) {
    formData.append("photos", file);
  }

  const headers = new Headers();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_URL}/api/vehicles/${vehicleId}/photos`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "include",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(payload?.message ?? "Téléversement impossible.") as ApiError;
    error.status = response.status;
    throw error;
  }

  return payload.data as { count: number; vehicleId: string; publicationStatus?: string };
}

/** Supprime une photo d'un véhicule (réservé au propriétaire). */
export async function deleteVehiclePhoto(vehicleId: string, photoId: string) {
  return apiFetch<{ status: "ok"; data: { deleted: boolean; photoId: string } }>(
    `/api/vehicles/${vehicleId}/photos/${photoId}`,
    { method: "DELETE" },
  );
}
