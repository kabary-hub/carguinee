/**
 * Routes API pour la gestion des feature flags (admin only).
 *
 * GET    /api/admin/feature-flags          → Liste tous les flags
 * POST   /api/admin/feature-flags          → Crée un nouveau flag
 * PATCH  /api/admin/feature-flags/:key     → Met à jour un flag
 * DELETE /api/admin/feature-flags/:key     → Supprime un flag
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

// Toutes les routes nécessitent admin
featureFlagsRouter.use(requireAuth, requireRoles("ADMIN"));

// ── GET /api/admin/feature-flags ──
featureFlagsRouter.get("/", (_request, response) => {
  try {
    const flags = listFeatureFlags();
    response.json({ status: "ok", data: flags });
  } catch (error) {
    logger.error({ error }, "Erreur liste feature flags");
    handleRouteError(error, response, "Impossible de charger les feature flags.", 500);
  }
});

// ── POST /api/admin/feature-flags ──
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
    response.status(400).json({
      status: "error",
      message: "Données invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const flag = createFeatureFlag(parsed.data.key, parsed.data.description, {
      enabled: parsed.data.enabled,
      rolloutPercentage: parsed.data.rolloutPercentage,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    });
    response.status(201).json({ status: "ok", data: flag });
  } catch (error) {
    handleRouteError(error, response, "Impossible de créer le flag.", 500);
  }
});

// ── PATCH /api/admin/feature-flags/:key ──
const updateFlagSchema = z.object({
  enabled: z.boolean().optional(),
  rolloutPercentage: z.number().int().min(0).max(100).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

featureFlagsRouter.patch("/:key", (request, response) => {
  const { key } = request.params;
  const parsed = updateFlagSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const updates = {
      ...parsed.data,
      expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined,
    };
    const success = updateFeatureFlag(key, updates);
    if (!success) {
      response.status(404).json({ status: "error", message: `Flag "${key}" introuvable.` });
      return;
    }
    response.json({ status: "ok", message: `Flag "${key}" mis à jour.` });
  } catch (error) {
    handleRouteError(error, response, "Impossible de mettre à jour le flag.", 500);
  }
});

// ── GET /api/feature-flags/check/:key (public — pour le frontend) ──
// Note: Cette route est montée en dehors du router admin
export function featureFlagCheckHandler(request: any, response: any) {
  const { key } = request.params;
  const userId = request.user?.id;

  // Import dynamique pour éviter les circular deps
  const { isFeatureEnabled } = require("../../lib/feature-flags.js");
  const enabled = isFeatureEnabled(key, userId);

  response.json({
    status: "ok",
    data: { key, enabled },
  });
}
