/**
 * @swagger
 * /api/boosting/plans:
 *   get:
 *     tags: [Boosting]
 *     summary: Plans de boost disponibles
 *     responses:
 *       200:
 *         description: Liste des plans
 *
 * /api/boosting/activate:
 *   post:
 *     tags: [Boosting]
 *     summary: Activer un boost
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, level]
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *               level:
 *                 type: string
 *                 enum: [BASIC, PREMIUM, VIP]
 *               paymentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Boost activé
 *
 * /api/boosting/vehicle/{id}:
 *   get:
 *     tags: [Boosting]
 *     summary: Boost actif d'un véhicule
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Boost trouvé
 *
 * /api/boosting/my-boosts:
 *   get:
 *     tags: [Boosting]
 *     summary: Boosts du propriétaire
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des boosts
 *
 * /api/boosting/cancel/{id}:
 *   post:
 *     tags: [Boosting]
 *     summary: Annuler un boost
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Boost annulé
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
    response.status(201).json({ status: "ok", data: boost });
  } catch (error) {
    handleRouteError(error, response, "Impossible d'activer le boost.");
  }
});

// ── GET /api/boosting/vehicle/:id — Boost actif ─────────────────────────
boostingRouter.get("/vehicle/:id", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "ID invalide." });
    return;
  }

  try {
    const boost = await getVehicleBoost(parsedId.data);
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

// ── POST /api/boosting/cancel/:id — Annuler ─────────────────────────────
boostingRouter.post("/cancel/:id", requireAuth, async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.id);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "ID invalide." });
    return;
  }

  try {
    const userId = request.auth!.userId;
    const result = await cancelBoost(parsedId.data, userId);
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Impossible d'annuler le boost.");
  }
});
