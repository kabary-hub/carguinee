/**
 * @swagger
 * /api/referrals/generate:
 *   post:
 *     tags: [Referrals]
 *     summary: Générer un code de parrainage
 *     security:
 *       - BearerAuth: []
 * /api/referrals/stats:
 *   get:
 *     tags: [Referrals]
 *     summary: Statistiques de parrainage
 *     security:
 *       - BearerAuth: []
 * /api/referrals/history:
 *   get:
 *     tags: [Referrals]
 *     summary: Historique des points
 *     security:
 *       - BearerAuth: []
 * /api/referrals/discount:
 *   post:
 *     tags: [Referrals]
 *     summary: Calculer la réduction disponible
 *     security:
 *       - BearerAuth: []
 */

import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { handleRouteError } from "../../lib/route-helpers.js";
import {
  generateReferralCode,
  getReferralStats,
  getLoyaltyHistory,
  calculateDiscount,
} from "./referral.service.js";

export const referralRouter = Router();

referralRouter.post("/generate", requireAuth, async (request, response) => {
  try {
    const userId = request.auth!.userId;
    const code = await generateReferralCode(userId);
    response.json({ status: "ok", data: { code } });
  } catch (error) {
    handleRouteError(error, response, "Impossible de générer le code.", 500);
  }
});

referralRouter.get("/stats", requireAuth, async (request, response) => {
  try {
    const userId = request.auth!.userId;
    const stats = await getReferralStats(userId);
    response.json({ status: "ok", data: stats });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

referralRouter.get("/history", requireAuth, async (request, response) => {
  try {
    const userId = request.auth!.userId;
    const page = Number(request.query.page) || 1;
    const history = await getLoyaltyHistory(userId, page);
    response.json({ status: "ok", data: history });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

referralRouter.post("/discount", requireAuth, async (request, response) => {
  try {
    const userId = request.auth!.userId;
    const discount = await calculateDiscount(userId);
    response.json({ status: "ok", data: discount });
  } catch (error) {
    handleRouteError(error, response, "Impossible de calculer la réduction.");
  }
});
