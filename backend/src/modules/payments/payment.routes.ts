/**
 * Routes API — Paiements Orange Money
 *
 * POST   /api/payments              → Initier un paiement
 * GET    /api/payments/:id/status   → Vérifier le statut
 * POST   /api/payments/callback     → Callback Orange Money (webhook)
 * GET    /api/payments/history      → Historique des paiements utilisateur
 */

import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../auth/auth.middleware.js";
import { handleRouteError } from "../../lib/route-helpers.js";
import {
  initiateOrangeMoneyPayment,
  checkOrangeMoneyStatus,
  handleOrangeMoneyCallback,
} from "./payment.service.js";
import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";
import { env } from "../../config/env.js";

export const paymentRouter = Router();

// ── POST /api/payments — Initier un paiement ─────────────────────────────

const createPaymentSchema = z.object({
  bookingId: z.string().uuid(),
  phone: z.string().min(8),
});

paymentRouter.post("/", requireAuth, async (request, response) => {
  const parsed = createPaymentSchema.safeParse(request.body);
  if (!parsed.success) {
    response.status(400).json({
      status: "error",
      message: "Données invalides.",
      details: parsed.error.flatten(),
    });
    return;
  }

  const userId = (request as any).user.id;

  try {
    // Vérifier que la réservation appartient à l'utilisateur
    const booking = await prisma.rentalBooking.findUnique({
      where: { id: parsed.data.bookingId },
      include: { payments: { where: { status: "PAID" } } },
    });

    if (!booking) {
      response.status(404).json({ status: "error", message: "Réservation introuvable." });
      return;
    }

    if (booking.customerId !== userId) {
      response.status(403).json({ status: "error", message: "Accès refusé." });
      return;
    }

    if (booking.payments.length > 0) {
      response.status(409).json({ status: "error", message: "Réservation déjà payée." });
      return;
    }

    if (booking.status !== "EN_ATTENTE") {
      response.status(400).json({ status: "error", message: "Réservation non éligible au paiement." });
      return;
    }

    const baseUrl = env.CORS_ORIGIN || "http://localhost:5173";
    const { pay_token, payment_url } = await initiateOrangeMoneyPayment({
      bookingId: parsed.data.bookingId,
      userId,
      amount: booking.totalAmountGnf,
      phone: parsed.data.phone,
      return_url: `${baseUrl}/reservations?payment=success`,
      cancel_url: `${baseUrl}/reservations?payment=cancelled`,
      notif_url: `${env.CORS_ORIGIN || "http://localhost:3000"}/api/payments/callback`,
    });

    response.json({
      status: "ok",
      data: { pay_token, payment_url, amount: booking.totalAmountGnf },
    });
  } catch (error) {
    handleRouteError(error, response, "Impossible d'initier le paiement.", 500);
  }
});

// ── GET /api/payments/:id/status — Vérifier le statut ────────────────────

paymentRouter.get("/:id/status", requireAuth, async (request, response) => {
  const id = String(request.params.id);

  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      response.status(404).json({ status: "error", message: "Paiement introuvable." });
      return;
    }

    // Si encore en attente, vérifier auprès d'Orange Money
    if (payment.status === "PENDING" && payment.providerTxId) {
      const omStatus = await checkOrangeMoneyStatus(payment.providerTxId!);
      if (omStatus.status !== payment.status) {
        await prisma.payment.update({
          where: { id },
          data: {
            status: omStatus.status,
            ...(omStatus.status === "PAID" ? { paidAt: new Date() } : {}),
          },
        });
      }
    }

    response.json({
      status: "ok",
      data: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        createdAt: payment.createdAt,
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Erreur de vérification.", 500);
  }
});

// ── POST /api/payments/callback — Webhook Orange Money ────────────────────
// Pas d'auth — c'est un webhook externe
paymentRouter.post("/callback", async (request, response) => {
  try {
    logger.info({ body: request.body }, "Callback Orange Money reçu");
    await handleOrangeMoneyCallback(request.body);
    response.status(200).json({ status: "ok" });
  } catch (error) {
    logger.error({ error }, "Erreur callback Orange Money");
    response.status(200).json({ status: "ok" }); // Toujours 200 pour Orange
  }
});

// ── GET /api/payments/history — Historique utilisateur ────────────────────

paymentRouter.get("/history", requireAuth, async (request, response) => {
  const userId = (request as any).user.id;
  const page = Number(request.query.page) || 1;
  const pageSize = Math.min(Number(request.query.pageSize) || 20, 50);

  try {
    const [items, total] = await Promise.all([
      prisma.payment.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          booking: {
            include: {
              vehicle: { select: { brand: true, model: true } },
            },
          },
        },
      }),
      prisma.payment.count({ where: { userId } }),
    ]);

    response.json({
      status: "ok",
      data: {
        items,
        pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
      },
    });
  } catch (error) {
    handleRouteError(error, response, "Erreur de chargement.", 500);
  }
});
