import { Router } from "express";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import {
  vehiclePhotoUpload,
  vehiclePhotoUploadErrorHandler,
} from "../../middleware/vehicle-upload.js";
import {
  addVehiclePhotos,
  deleteVehiclePhoto,
} from "./vehicle-photo.service.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";

export const vehiclePhotoRouter = Router();

function getParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

vehiclePhotoRouter.post(
  "/:id/photos",
  requireAuth,
  requireRoles("PROPRIETAIRE"),
  vehiclePhotoUpload.array("photos", 8),
  async (request, response) => {
    const files = request.files as Express.Multer.File[] | undefined;
    const ownerId = extractUserId(request, response);
    if (!ownerId) return;

    const vehicleId = getParam(request.params.id);

    if (!vehicleId) {
      response.status(400).json({ status: "error", message: "Véhicule invalide." });
      return;
    }

    if (!files || files.length === 0) {
      response.status(400).json({ status: "error", message: "Au moins une photo est requise." });
      return;
    }

    try {
      const result = await addVehiclePhotos(vehicleId, ownerId, files, request.auth?.role);
      response.status(201).json({ status: "ok", data: result });
    } catch (error) {
      handleRouteError(error, response, "Upload impossible.");
    }
  },
);

vehiclePhotoRouter.delete(
  "/:id/photos/:photoId",
  requireAuth,
  requireRoles("PROPRIETAIRE"),
  async (request, response) => {
    const ownerId = extractUserId(request, response);
    if (!ownerId) return;

    const vehicleId = getParam(request.params.id);
    const photoId = getParam(request.params.photoId);

    if (!vehicleId || !photoId) {
      response.status(400).json({ status: "error", message: "Identifiants invalides." });
      return;
    }

    try {
      const result = await deleteVehiclePhoto(vehicleId, photoId, ownerId, request.auth?.role);
      response.json({ status: "ok", data: result });
    } catch (error) {
      handleRouteError(error, response, "Suppression impossible.", 404);
    }
  },
);

vehiclePhotoRouter.use(vehiclePhotoUploadErrorHandler);
