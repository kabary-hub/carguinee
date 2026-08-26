/**
 * @swagger
 * /api/admin/feature-flags:
 *   get:
 *     tags: [Admin - Feature Flags]
 *     summary: Lister tous les feature flags
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des feature flags
 *   post:
 *     tags: [Admin - Feature Flags]
 *     summary: Créer un feature flag
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [key, description]
 *             properties:
 *               key:
 *                 type: string
 *                 pattern: "^[a-z0-9-]+$"
 *               description:
 *                 type: string
 *               enabled:
 *                 type: boolean
 *                 default: false
 * /api/admin/feature-flags/{key}:
 *   patch:
 *     tags: [Admin - Feature Flags]
 *     summary: Mettre à jour un feature flag
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 *   delete:
 *     tags: [Admin - Feature Flags]
 *     summary: Supprimer un feature flag
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema: { type: string }
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRoles } from "../auth/auth.middleware.js";
import { handleRouteError } from "../../lib/route-helpers.js";
import {
  listFeatureFlags,
  updateFeatureFlag,
  createFeatureFlag,
} from "../../lib/feature-flags.js";
import { logger } from "../../lib/logger.js";

export const featureFlagsRouter = Router();

featureFlagsRouter.use(requireAuth, requireRoles("ADMIN"));

featureFlagsRouter.get("/", (_request, response) => {
  try {
    const flags = listFeatureFlags();
    response.json({ status: "ok", data: flags });
  } catch (error) {
    logger.error({ error }, "Erreur liste feature flags");
    handleRouteError(error, response, "Impossible de charger les feature flags.", 500);
  }
});

const createFlagSchema = z.object({
  key: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Format: lowercase, numbers, dashes"),
  description: z.string().min(1).max(200),
  enabled: z.boolean().optional().default(false),
  rolloutPercentage: z.number().int().min(0).max(100).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

featureFlagsRouter.post("/", async (request, response) => {
  const parsed = createFlagSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides.", details: parsed.error.flatten() });
    return;
  }

  try {
    const { key, description, enabled, rolloutPercentage, expiresAt } = parsed.data;
    const flag = createFeatureFlag(key, description, { enabled, rolloutPercentage: rolloutPercentage ?? null, expiresAt: expiresAt as any ?? null });
    response.status(201).json({ status: "ok", data: flag });
  } catch (error) {
    handleRouteError(error, response, "Impossible de créer le flag.");
  }
});

const updateFlagSchema = z.object({
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

featureFlagsRouter.patch("/:key", async (request, response) => {
  const parsed = updateFlagSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const updated = updateFeatureFlag(request.params.key, parsed.data as any);
    if (!updated) {
      response.status(404).json({ status: "error", message: "Flag introuvable." });
      return;
    }
    response.json({ status: "ok", message: "Flag mis à jour." });
  } catch (error) {
    handleRouteError(error, response, "Impossible de mettre à jour le flag.");
  }
});

featureFlagsRouter.delete("/:key", async (request, response) => {
  try {
    const deleted = updateFeatureFlag(request.params.key, { enabled: false });
    if (!deleted) {
      response.status(404).json({ status: "error", message: "Flag introuvable." });
      return;
    }
    response.json({ status: "ok", message: "Flag supprimé." });
  } catch (error) {
    handleRouteError(error, response, "Impossible de supprimer le flag.");
  }
});
