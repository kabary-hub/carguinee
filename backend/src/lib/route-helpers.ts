import { z } from "zod";
import type { Request, Response } from "express";

/**
 * Extrait le userId de la requête authentifiée.
 * Si l'utilisateur n'est pas authentifié, envoie une réponse 401 et retourne null.
 */
export function extractUserId(request: Request, response: Response): string | null {
  const userId = request.auth?.userId;
  if (!userId) {
    response.status(401).json({ status: "error", message: "Authentification requise." });
    return null;
  }
  return userId;
}

/**
 * Gère les erreurs dans les routes avec un message de fallback.
 */
export function handleRouteError(
  error: unknown,
  response: Response,
  fallbackMsg: string,
  statusCode = 400,
) {
  response.status(statusCode).json({
    status: "error",
    message: error instanceof Error ? error.message : fallbackMsg,
  });
}

/**
 * Schema Zod pour les paramètres de pagination (page, pageSize).
 */
export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});
