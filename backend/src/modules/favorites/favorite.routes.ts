/**
 * @swagger
 * /api/favorites:
 *   post:
 *     tags: [Favorites]
 *     summary: Ajouter un favori
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleId]
 *             properties:
 *               vehicleId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Favori ajouté
 *       400:
 *         description: ID invalide
 *
 *   get:
 *     tags: [Favorites]
 *     summary: Mes favoris
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des favoris
 *
 * /api/favorites/{vehicleId}:
 *   delete:
 *     tags: [Favorites]
 *     summary: Supprimer un favori
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Favori supprimé
 *
 * /api/favorites/check/{vehicleId}:
 *   get:
 *     tags: [Favorites]
 *     summary: Vérifier si un véhicule est en favori
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vehicleId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Résultat de la vérification
 *
 * /api/favorites/batch:
 *   post:
 *     tags: [Favorites]
 *     summary: Vérifier plusieurs favoris d'un coup
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [vehicleIds]
 *             properties:
 *               vehicleIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Map vehicleId → isFavorite
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { addFavorite, removeFavorite, listFavorites, isFavorite } from "./favorite.service.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";
import { prisma } from "../../lib/prisma.js";

export const favoriteRouter = Router();

// ── Ajouter un favori ─────────────────────────────────────────────────────────
favoriteRouter.post("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = z.object({ vehicleId: z.string().uuid() }).safeParse(request.body);

  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Identifiant de véhicule invalide." });
    return;
  }

  try {
    const favorite = await addFavorite(userId, parsed.data.vehicleId);
    response.status(201).json({ status: "ok", data: favorite });
  } catch (error) {
    handleRouteError(error, response, "Impossible d'ajouter le favori.");
  }
});

// ── Supprimer un favori ───────────────────────────────────────────────────────
favoriteRouter.delete("/:vehicleId", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.vehicleId);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const result = await removeFavorite(userId, parsedId.data);
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Impossible de supprimer le favori.");
  }
});

// ── Récupérer les favoris de l'utilisateur ────────────────────────────────────
favoriteRouter.get("/", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  try {
    const favorites = await listFavorites(userId);
    response.json({ status: "ok", data: favorites });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

// ── Vérifier si un véhicule est en favori ─────────────────────────────────────
favoriteRouter.get("/check/:vehicleId", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.vehicleId);
  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "ID invalide." });
    return;
  }

  try {
    const favorited = await isFavorite(userId, parsedId.data);
    response.json({ status: "ok", data: { isFavorite: favorited } });
  } catch (error) {
    handleRouteError(error, response, "Erreur de vérification.", 500);
  }
});

// ── Batch check ───────────────────────────────────────────────────────────────
favoriteRouter.post("/batch", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsed = z.object({ vehicleIds: z.array(z.string().uuid()) }).safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId, vehicleId: { in: parsed.data.vehicleIds } },
      select: { vehicleId: true },
    });

    const favSet = new Set(favorites.map((f) => f.vehicleId));
    const result: Record<string, boolean> = {};
    for (const id of parsed.data.vehicleIds) {
      result[id] = favSet.has(id);
    }

    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur de vérification.", 500);
  }
});
