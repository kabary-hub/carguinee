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
    handleRouteError(error, response, "Erreur lors de la récupération des favoris.", 500);
  }
});

// ── Vérifier si un véhicule est en favori ─────────────────────────────────────
favoriteRouter.get("/check/:vehicleId", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const parsedId = z.string().uuid().safeParse(request.params.vehicleId);

  if (!parsedId.success) {
    response.status(400).json({ status: "error", message: "Données invalides." });
    return;
  }

  const favorited = await isFavorite(userId, parsedId.data);
  response.json({ status: "ok", data: { isFavorite: favorited } });
});

/**
 * @swagger
 * /api/favorites/check-batch:
 *   get:
 *     tags: [Favorites]
 *     summary: Vérifier les favoris pour plusieurs véhicules
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: ids
 *         required: true
 *         schema:
 *           type: string
 *         description: IDs séparés par des virgules (max 50)
 *     responses:
 *       200:
 *         description: Map vehicleId → boolean
 */
favoriteRouter.get("/check-batch", requireAuth, async (request, response) => {
  const userId = extractUserId(request, response);
  if (!userId) return;

  const batchQuerySchema = z.object({
    ids: z.string().min(1),
  });
  const parsed = batchQuerySchema.safeParse(request.query);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Paramètre 'ids' requis (IDs séparés par des virgules)." });
    return;
  }

  const vehicleIds = parsed.data.ids
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 50); // max 50

  if (vehicleIds.length === 0) {
    response.json({ status: "ok", data: {} });
    return;
  }

  const rows = await prisma.favorite.findMany({
    where: { userId, vehicleId: { in: vehicleIds } },
    select: { vehicleId: true },
  });

  const favoritedIds = new Set(rows.map((r) => r.vehicleId));
  const result: Record<string, boolean> = {};
  for (const id of vehicleIds) {
    result[id] = favoritedIds.has(id);
  }

  response.json({ status: "ok", data: result });
});
