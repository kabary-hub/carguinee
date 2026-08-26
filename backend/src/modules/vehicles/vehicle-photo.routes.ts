/**
 * @swagger
 * /api/vehicles/{id}/photos:
 *   post:
 *     tags: [Vehicles - Photos]
 *     summary: Ajouter des photos à un véhicule
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [photos]
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 maxItems: 8
 *     responses:
 *       201:
 *         description: Photos ajoutées
 *       400:
 *         description: Aucune photo fournie
 *
 * /api/vehicles/{id}/photos/{photoId}:
 *   delete:
 *     tags: [Vehicles - Photos]
 *     summary: Supprimer une photo
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: photoId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Photo supprimée
 */

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
      response.status(400).json({ status: "error", message: "Paramètres invalides." });
      return;
    }

    try {
      await deleteVehiclePhoto(vehicleId, photoId, ownerId);
      response.json({ status: "ok", message: "Photo supprimée." });
    } catch (error) {
      handleRouteError(error, response, "Suppression impossible.");
    }
  },
);
