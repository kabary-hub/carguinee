/**
 * Routes API — Parrainage et Points de fidélité
 *
 * POST   /api/referrals/generate   → Générer un code de parrainage
 * GET    /api/referrals/stats      → Statistiques de parrainage
 * GET    /api/referrals/history    → Historique des points
 * POST   /api/referrals/apply      → Appliquer un code (utilisé à l'inscription)
 * POST   /api/referrals/discount   → Calculer/appliquer une réduction
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { handleRouteError } from "../../lib/route-helpers.js";
import {
  generateReferralCode,
  getReferralStats,
  getLoyaltyHistory,
  calculateDiscount,
} from "./referral.service.js";

export const referralRouter = Router();

// ── POST /api/referrals/generate — Générer un code ──────────────────────
referralRouter.post("/generate", requireAuth, async (request, response) => {
  try {
    const userId = (request as any).user.id;
    const code = await generateReferralCode(userId);
    response.json({ status: "ok", data: { code } });
  } catch (error) {
    handleRouteError(error, response, "Impossible de générer le code.", 500);
  }
});

// ── GET /api/referrals/stats — Statistiques ──────────────────────────────
referralRouter.get("/stats", requireAuth, async (request, response) => {
  try {
    const userId = (request as any).user.id;
    const stats = await getReferralStats(userId);
    response.json({ status: "ok", data: stats });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

// ── GET /api/referrals/history — Historique des points ───────────────────
referralRouter.get("/history", requireAuth, async (request, response) => {
  try {
    const userId = (request as any).user.id;
    const page = Number(request.query.page) || 1;
    const pageSize = Math.min(Number(request.query.pageSize) || 20, 50);
    const result = await getLoyaltyHistory(userId, page, pageSize);
    response.json({ status: "ok", data: result });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});

// ── POST /api/referrals/discount — Calculer réduction ────────────────────
const discountSchema = z.object({
  bookingAmount: z.number().int().positive(),
});

referralRouter.post("/discount", requireAuth, async (request, response) => {
  const parsed = discountSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({ status: "error", message: "Montant invalide." });
    return;
  }

  try {
    const userId = (request as any).user.id;
    const discount = await calculateDiscount(userId);
    const discountAmount = Math.floor((parsed.data.bookingAmount * discount.discountPercent) / 100);

    response.json({
      status: "ok",
      data: {
        ...discount,
        originalAmount: parsed.data.bookingAmount,
        discountAmount,
        finalAmount: parsed.data.bookingAmount - discountAmount,
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Erreur de calcul.", 500);
  }
});
