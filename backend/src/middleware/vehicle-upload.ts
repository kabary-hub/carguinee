import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import {
  isAllowedPhotoMimeType,
  MAX_PHOTOS_PER_VEHICLE,
  MAX_PHOTO_SIZE_BYTES,
  INVALID_PHOTO_TYPE_MESSAGE,
} from "../modules/vehicles/photo-limits.js";

// Dossier de stockage des photos téléversées.
// Par défaut : backend/uploads/vehicles (dossier de production, jamais supprimé).
// Surchargeable via VEHICLE_UPLOAD_DIR afin que les tests utilisent un
// dossier temporaire isolé, sans jamais écrire dans les vraies photos.
const uploadDirectory = process.env.VEHICLE_UPLOAD_DIR
  ? path.resolve(process.env.VEHICLE_UPLOAD_DIR)
  : path.resolve("uploads", "vehicles");
fs.mkdirSync(uploadDirectory, { recursive: true });

export { uploadDirectory as vehicleUploadDirectory };

const storage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, uploadDirectory);
  },
  filename: (_request, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extension}`);
  },
});

export const vehiclePhotoUpload = multer({
  storage,
  limits: {
    // Limite stricte : jamais plus de 8 photos par requête (la limite totale
    // de 8 par véhicule est revérifiée dans le service, photos existantes incluses).
    files: MAX_PHOTOS_PER_VEHICLE,
    // busboy (multer) déclenche LIMIT_FILE_SIZE dès que la taille atteint la
    // limite. Pour que « au maximum 2 Mo » accepte une photo de 2 Mo exactement
    // et ne refuse que ce qui dépasse, la limite technique est fixée à 1 octet
    // au-dessus de la règle métier.
    fileSize: MAX_PHOTO_SIZE_BYTES + 1,
  },
  fileFilter: (_request, file, callback) => {
    if (!isAllowedPhotoMimeType(file.mimetype)) {
      callback(new Error(INVALID_PHOTO_TYPE_MESSAGE));
      return;
    }

    callback(null, true);
  },
});

/**
 * Gestionnaire d'erreurs du middleware d'upload : traduit les erreurs multer
 * et les erreurs de filtre en réponses JSON avec un message compréhensible
 * en français. Exporté pour être réutilisé par les routes et les tests.
 */
export function vehiclePhotoUploadErrorHandler(
  error: unknown,
  _request: Request,
  response: Response,
  next: NextFunction,
) {
  if (error instanceof multer.MulterError) {
    response.status(400).json({
      status: "error",
      message:
        error.code === "LIMIT_FILE_SIZE"
          ? "Chaque photo doit faire au maximum 2 Mo."
          : error.code === "LIMIT_FILE_COUNT"
            ? "Vous pouvez envoyer au maximum 8 photos."
            : error.message,
    });
    return;
  }

  if (error instanceof Error) {
    response.status(400).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  next(error);
}

export function getVehiclePhotoUrl(filename: string) {
  return `/uploads/vehicles/${filename}`;
}
