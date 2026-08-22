import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { addFavorite, removeFavorite, listFavorites, isFavorite } from "./favorite.service.js";
import { extractUserId, handleRouteError } from "../../lib/route-helpers.js";

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
