import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { logger } from "../lib/logger.js";

/**
 * Erreur métier personnalisée pour les routes.
 * Permet de lever des erreurs avec un status HTTP et un message utilisateur.
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
  ) {
    super(message);
    this.name = "AppError";
  }
}

/**
 * Middleware de gestion d'erreurs global.
 * DOIT avoir les 4 paramètres (express les reconnaît comme error handler
 * uniquement avec cette signature).
 */
export function errorHandler(error: Error, request: Request, response: Response, _next: NextFunction) {
  // ── Erreurs Zod (validation de données) ─────────────────────────────────
  if (error instanceof ZodError) {
    response.status(400).json({
      status: "error",
      message: "Données invalides.",
      details: error.flatten(),
    });
    return;
  }

  // ── Erreurs Prisma ──────────────────────────────────────────────────────
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        // Violation d'unicité
        const target = (error.meta?.target as string[])?.join(", ") || "champ";
        response.status(409).json({
          status: "error",
          message: `Une entrée avec ce ${target} existe déjà.`,
        });
        return;
      }
      case "P2025": {
        // Enregistrement non trouvé
        response.status(404).json({
          status: "error",
          message: "Ressource introuvable.",
        });
        return;
      }
      case "P2003": {
        // Violation de clé étrangère
        response.status(400).json({
          status: "error",
          message: "Référence invalide vers une ressource inexistante.",
        });
        return;
      }
      default:
        logger.error({ prismaCode: error.code, message: error.message }, "Prisma known error");
        response.status(500).json({
          status: "error",
          message: "Erreur de base de données.",
        });
        return;
    }
  }

  // ── Erreurs Prisma inconnues ────────────────────────────────────────────
  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    logger.error({ error }, "Prisma unknown error");
    response.status(500).json({
      status: "error",
      message: "Erreur de base de données.",
    });
    return;
  }

  // ── Erreurs métier (AppError) ───────────────────────────────────────────
  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      status: "error",
      message: error.message,
    });
    return;
  }

  // ── Erreur CORS ─────────────────────────────────────────────────────────
  if (error.message?.includes("Origine non autorisée")) {
    response.status(403).json({
      status: "error",
      message: "Origine non autorisée.",
    });
    return;
  }

  // ── Erreur générique ────────────────────────────────────────────────────
  logger.error({ error: error.message, stack: error.stack }, "Unhandled error");
  response.status(500).json({
    status: "error",
    message: "Une erreur interne est survenue.",
  });
}
