/**
 * @swagger
 * /api/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Créer un avis
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId, rating]
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Avis créé
 *       400:
 *         description: Données invalides
 *
 * /api/reviews/vehicle/{vehicleId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Avis d'un véhicule
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Liste paginée des avis
 *
 * /api/reviews/user/{userId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Avis d'un utilisateur
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: pageSize
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Liste paginée des avis
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { createReviewSchema } from "./review.schemas.js";
import { createReview, getReviewsByVehicle, getReviewsByUser } from "./review.service.js";
import { extractUserId, handleRouteError, paginationQuery } from "../../lib/route-helpers.js";

export const reviewRouter = Router();

// ── Créer un avis ─────────────────────────────────────────────────────────────
reviewRouter.post("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = createReviewSchema.safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données d'avis invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  try {
    const review = await createReview(userId, parsed.data);
    response.status(201).json({ status: "ok", data: review });
  } catch (error) {
    handleRouteError(error, response, "Impossible de créer l'avis.");
  }
});

// ── Récupérer les avis d'un véhicule ──────────────────────────────────────────
reviewRouter.get("/vehicle/:vehicleId", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.vehicleId);
  const { page, pageSize } = paginationQuery.parse(request.query);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  try {
    const result = await getReviewsByVehicle(parsedId.data, page, pageSize);
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur lors de la récupération des avis.", 500);
  }
});

// ── Récupérer les avis d'un utilisateur ───────────────────────────────────────
reviewRouter.get("/user/:userId", async (request, response) => {
  const parsedId = z.string().uuid().safeParse(request.params.userId);
  const { page, pageSize } = paginationQuery.parse(request.query);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Identifiant invalide." });
    return;
  }

  try {
    const result = await getReviewsByUser(parsedId.data, page, pageSize);
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur lors de la récupération des avis.", 500);
  }
});
