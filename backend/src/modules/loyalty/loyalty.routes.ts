/**
 * @swagger
 * /api/loyalty/points:
 *   get:
 *     tags: [Loyalty]
 *     summary: Solde de points de fidélité
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Solde de points
 *       401:
 *         description: Non authentifié
 *
 * /api/loyalty/history:
 *   get:
 *     tags: [Loyalty]
 *     summary: Historique des transactions de fidélité
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Historique des transactions
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { handleRouteError } from "../../lib/route-helpers.js";
import { prisma } from "../../lib/prisma.js";

export const loyaltyRouter = Router();

// ── GET /api/loyalty/points — Solde actuel ──────────────────────────────
loyaltyRouter.get("/points", requireAuth, async (request, response) => {
  const userId = request.auth!.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { referralPoints: true },
    });

    response.json({
      status: "ok",
      data: { points: user?.referralPoints ?? 0 },
    });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

// ── GET /api/loyalty/history — Historique des transactions ──────────────
loyaltyRouter.get("/history", requireAuth, async (request, response) => {
  const userId = request.auth!.userId;

  try {
    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        points: true,
        type: true,
        description: true,
        referenceId: true,
        balance: true,
        createdAt: true,
      },
    });

    response.json({ status: "ok", data: transactions });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});
