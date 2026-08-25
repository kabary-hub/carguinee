/**
 * Routes API — Boosting Véhicules
 *
 * GET    /api/boosting/plans       → Plans disponibles
 * POST   /api/boosting/activate    → Activer un boost
 * GET    /api/boosting/vehicle/:id → Boost actif d'un véhicule
 * GET    /api/boosting/my-boosts   → Boosts du propriétaire
 * POST   /api/boosting/cancel/:id  → Annuler un boost
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { handleRouteError } from "../../lib/route-helpers.js";
import {
  BOOST_PLANS,
  activateBoost,
  getVehicleBoost,
  getOwnerBoosts,
  cancelBoost,
} from "./boosting.service.js";

export const boostingRouter = Router();

// ── GET /api/boosting/plans — Plans disponibles ──────────────────────────
boostingRouter.get("/plans", (_request, response) => {
  response.json({ status: "ok", data: BOOST_PLANS });
});

// ── POST /api/boosting/activate — Activer un boost ──────────────────────
const activateSchema = z.object({
  vehicleId: z.string().uuid(),
  level: z.enum(["BASIC", "PREMIUM", "VIP"]),
  paymentId: z.string().uuid().optional(),
});

boostingRouter.post("/activate", requireAuth, async (request, response) => {
  const parsed = activateSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const userId = request.auth!.userId;
    const boost = await activateBoost({ ...parsed.data, userId });
    response.json({ status: "ok", data: boost });
  } catch (error) {
    handleRouteError(error, response, "Impossible d'activer le boost.", 500);
  }
});

// ── GET /api/boosting/vehicle/:id — Boost d'un véhicule ─────────────────
boostingRouter.get("/vehicle/:id", async (request, response) => {
  try {
    const boost = await getVehicleBoost(request.params.id);
    response.json({ status: "ok", data: boost });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

// ── GET /api/boosting/my-boosts — Boosts du propriétaire ────────────────
boostingRouter.get("/my-boosts", requireAuth, async (request, response) => {
  try {
    const userId = request.auth!.userId;
    const boosts = await getOwnerBoosts(userId);
    response.json({ status: "ok", data: boosts });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

// ── POST /api/boosting/cancel/:id — Annuler un boost ────────────────────
boostingRouter.post("/cancel/:id", requireAuth, async (request, response) => {
  try {
    const userId = request.auth!.userId;
    await cancelBoost(String(request.params.id), userId);
    response.json({ status: "ok", message: "Boost annulé." });
  } catch (error) {
    handleRouteError(error, response, "Impossible d'annuler le boost.", 500);
  }
});
