import { Router } from "express";
import { z } from "zod";
import { optionalAuth, requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { createVehicleSchema, updateVehicleSchema, vehicleListQuerySchema } from "./vehicle.schemas.js";
import {
  archiveVehicle,
  createVehicle,
  getVehicleById,
  listOwnerVehicles,
  listPublicVehicles,
  restoreVehicle,
  updateVehicle,
  approveVehicle,
  listPendingVehicleValidations,
  rejectVehicle,
  submitVehicleForValidation,
} from "./vehicle.service.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";

export const vehicleRouter = Router();
const idSchema = z.string().uuid();

/**
 * @swagger
 * /api/vehicles:
 *   get:
 *     tags: [Vehicles]
 *     summary: Liste publique des véhicules
 *     parameters:
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Recherche par marque/modèle
 *       - in: query
 *         name: type
 *         schema: { type: string, enum: [CITADINE, BERLINE, SUV, QUATRE_QUATRE, UTILITAIRE, MINIBUS, CAMION, MOTO] }
 *       - in: query
 *         name: commune
 *         schema: { type: string, enum: [KALOUM, DIXINN, MATAM, RATOMA, MATOTO] }
 *       - in: query
 *         name: supportsRental
 *         schema: { type: boolean }
 *       - in: query
 *         name: supportsSale
 *         schema: { type: boolean }
 *       - in: query
 *         name: publicationStatus
 *         schema: { type: string }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: Liste des véhicules
 */
vehicleRouter.get("/", async (request, response) => {
  const parsedQuery = vehicleListQuerySchema.safeParse(request.query);

  if (!parsedQuery.success) {
    response.status(400).json({
      status: "error",
      message: "Filtres invalides.",
      details: parsedQuery.error.flatten(),
    });
    return;
  }

  const result = await listPublicVehicles(parsedQuery.data);
  response.json({ status: "ok", data: result });
});

/**
 * @swagger
 * /api/vehicles/mine:
 *   get:
 *     tags: [Vehicles]
 *     summary: Véhicules du propriétaire connecté
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des véhicules du propriétaire
 *       401:
 *         description: Non authentifié
 */
vehicleRouter.get("/mine", requireAuth, async (request, response) => {
  const ownerId = request.auth?.userId;
  const role = request.auth?.role;
  if (!ownerId || !role || !["PROPRIETAIRE", "ADMIN"].includes(role)) {
    response.status(403).json({ status: "error", message: "Accès propriétaire requis." });
    return;
  }
  response.json({ status: "ok", data: await listOwnerVehicles(ownerId) });
});

vehicleRouter.get(
  "/admin/pending",
  requireAuth,
  requireRoles("ADMIN"),
  async (_request, response) => {
    const vehicles = await listPendingVehicleValidations();
    response.json({ status: "ok", data: vehicles });
  },
);

/**
 * @swagger
 * /api/vehicles/{id}:
 *   get:
 *     tags: [Vehicles]
 *     summary: Détails d'un véhicule
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Détails du véhicule
 *       404:
 *         description: Véhicule introuvable
 */
vehicleRouter.get("/:id", optionalAuth, async (request, response) => {
  const parsedId = idSchema.safeParse(request.params.id);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  try {
    const vehicle = await getVehicleById(
      parsedId.data,
      request.auth?.userId,
      request.auth?.role,
    );
    response.json({ status: "ok", data: vehicle });
  } catch (error) {
    handleRouteError(error, response, "Véhicule introuvable.", 404);
  }
});

vehicleRouter.post(
  "/",
  requireAuth,
  requireRoles("PROPRIETAIRE", "ADMIN"),
  async (request, response) => {
    const ownerId = extractUserId(request, response);
    if (!ownerId) return;

    const parsed = createVehicleSchema.safeParse(request.body);

    if (!parsed.success) {
      response.status(400).json({
        status: "error",
        message: "Données véhicule invalides.",
        details: parsed.error.flatten(),
      });
      return;
    }

    try {
      const vehicle = await createVehicle(ownerId, parsed.data);
      response.status(201).json({ status: "ok", data: vehicle });
    } catch (error) {
      handleRouteError(error, response, "Création impossible.");
    }
  },
);

vehicleRouter.patch("/:id", requireAuth, async (request, response) => {
  const userId = request.auth?.userId;
  const role = request.auth?.role;
  const parsedId = idSchema.safeParse(request.params.id);
  const parsed = updateVehicleSchema.safeParse(request.body);

  if (!userId || !role) {
    response.status(401).json({ status: "error", message: "Authentification requise." });
    return;
  }

  if (!parsedId.success || !parsed.success) {
    response.status(400).json({ status: "error", message: "Données de modification invalides." });
    return;
  }

  try {
    const vehicle = await updateVehicle(parsedId.data, userId, role, parsed.data);
    response.json({ status: "ok", data: vehicle });
  } catch (error) {
    response.status(403).json({ status: "error", message: error instanceof Error ? error.message : "Modification impossible." });
  }
});

vehicleRouter.patch("/:id/archive", requireAuth, async (request, response) => {
  const userId = request.auth?.userId;
  const role = request.auth?.role;
  const parsedId = idSchema.safeParse(request.params.id);

  if (!userId || !role || !parsedId.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const vehicle = await archiveVehicle(parsedId.data, userId, role);
    response.json({ status: "ok", data: vehicle });
  } catch (error) {
    response.status(403).json({ status: "error", message: error instanceof Error ? error.message : "Archivage impossible." });
  }
});

vehicleRouter.patch("/:id/restore", requireAuth, async (request, response) => {
  const userId = request.auth?.userId;
  const role = request.auth?.role;
  const parsedId = idSchema.safeParse(request.params.id);

  if (!userId || !role || !parsedId.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const vehicle = await restoreVehicle(parsedId.data, userId, role);
    response.json({ status: "ok", data: vehicle });
  } catch (error) {
    response.status(403).json({ status: "error", message: error instanceof Error ? error.message : "Restauration impossible." });
  }
});

vehicleRouter.patch("/:id/submit", requireAuth, async (request, response) => {
  const ownerId = extractUserId(request, response);
  if (!ownerId) return;

  const parsedId = idSchema.safeParse(request.params.id);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  try {
    const vehicle = await submitVehicleForValidation(parsedId.data, ownerId);
    response.json({ status: "ok", data: vehicle });
  } catch (error) {
    response.status(403).json({ status: "error", message: error instanceof Error ? error.message : "Soumission impossible." });
  }
});

vehicleRouter.patch(
  "/admin/:id/approve",
  requireAuth,
  requireRoles("ADMIN"),
  async (request, response) => {
    const adminId = extractUserId(request, response);
    if (!adminId) return;

    const parsedId = idSchema.safeParse(request.params.id);

    if (!parsedId.success) {
      response.status(400).json({ status: "error", message: "Identifiant invalide." });
      return;
    }

    try {
      const vehicle = await approveVehicle(parsedId.data, adminId);
      response.json({ status: "ok", data: vehicle });
    } catch (error) {
      handleRouteError(error, response, "Approbation impossible.");
    }
  },
);

vehicleRouter.patch(
  "/admin/:id/reject",
  requireAuth,
  requireRoles("ADMIN"),
  async (request, response) => {
    const adminId = extractUserId(request, response);
    if (!adminId) return;

    const parsedId = idSchema.safeParse(request.params.id);
    const parsedBody = z
      .object({ rejectionReason: z.string().trim().min(1).max(1000) })
      .safeParse(request.body);

    if (!parsedId.success) {
      response.status(400).json({ status: "error", message: "Identifiant invalide." });
      return;
    }

    if (!parsedBody.success) {
      response.status(400).json({
        status: "error",
        message: "Le motif du rejet est obligatoire.",
      });
      return;
    }

    try {
      const vehicle = await rejectVehicle(
        parsedId.data,
        adminId,
        parsedBody.data.rejectionReason,
      );
      response.json({ status: "ok", data: vehicle });
    } catch (error) {
      handleRouteError(error, response, "Rejet impossible.");
    }
  },
);
