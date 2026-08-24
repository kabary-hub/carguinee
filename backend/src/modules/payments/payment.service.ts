/**
 * Orange Money API — Service de paiement.
 *
 * Flow :
 * 1. Frontend crée un paiement → POST /api/payments
 * 2. Backend appelle l'API Orange Money (POST /api/om/payments)
 * 3. L'utilisateur confirme sur son téléphone
 * 4. Orange Money envoie un callback → POST /api/payments/callback
 * 5. Backend met à jour le statut du paiement
 *
 * API docs : https://www.orange-money.com/api/
 * Sandbox : https://devapi.orange-money.com
 */

import { prisma } from "../../lib/prisma.js";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";

// ── Types ────────────────────────────────────────────────────────────────

type OmPaymentRequest = {
  merchant_key: string;
  currency: string;
  order_id: string;
  amount: number;
  return_url: string;
  cancel_url: string;
  notif_url: string;
  lang: string;
};

type OmPaymentResponse = {
  status: number;
  message: string;
  pay_token: string;
  payment_url: string;
  notif_token: string;
};

type OmStatusResponse = {
  status: number;
  message: string;
  status_code: string;
  // INITIATED, PENDING, EXPIRED, SUCCESS, FAILED
};

// ── Configuration ────────────────────────────────────────────────────────

const OM_BASE_URL = env.OM_SANDBOX
  ? "https://devapi.orange-money.com"
  : "https://api.orange-money.com";

const OM_API_VERSION = "v1";

// ── Service ──────────────────────────────────────────────────────────────

/**
 * Initie un paiement Orange Money.
 */
export async function initiateOrangeMoneyPayment(params: {
  bookingId: string;
  userId: string;
  amount: number;
  phone: string;
  return_url: string;
  cancel_url: string;
  notif_url: string;
}): Promise<{ pay_token: string; payment_url: string }> {
  const { bookingId, userId, amount, phone, return_url, cancel_url, notif_url } = params;

  // Générer un order_id unique
  const orderId = `CGN-${bookingId.slice(0, 8)}-${Date.now()}`;

  // Créer le paiement en DB
  const payment = await prisma.payment.create({
    data: {
      bookingId,
      userId,
      amount,
      provider: "ORANGE_MONEY",
      phone,
      status: "PENDING",
      metadata: { orderId, return_url, cancel_url },
    },
  });

  logger.info({ paymentId: payment.id, orderId, amount }, "Paiement Orange Money initié");

  // Appeler l'API Orange Money
  const omRequest: OmPaymentRequest = {
    merchant_key: env.OM_MERCHANT_KEY ?? "",
    currency: "GNF",
    order_id: orderId,
    amount,
    return_url,
    cancel_url,
    notif_url,
    lang: "fr",
  };

  try {
    const token = await getOmAccessToken();

    const response = await fetch(
      `${OM_BASE_URL}/${OM_API_VERSION}/webpayment`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(omRequest),
      },
    );

    const data = (await response.json()) as OmPaymentResponse;

    if (data.status !== 201 && data.status !== 200) {
      logger.error({ omResponse: data }, "Orange Money API error");
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", metadata: { ...omRequest, response: data } },
      });
      throw new Error(`Orange Money error: ${data.message}`);
    }

    // Stocker le pay_token
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        providerTxId: data.pay_token,
        metadata: { orderId, pay_token: data.pay_token, notif_token: data.notif_token },
      },
    });

    return {
      pay_token: data.pay_token,
      payment_url: data.payment_url,
    };
  } catch (error) {
    logger.error({ error, paymentId: payment.id }, "Erreur initiation paiement OM");
    throw error;
  }
}

/**
 * Vérifie le statut d'un paiement Orange Money.
 */
export async function checkOrangeMoneyStatus(
  payToken: string,
): Promise<{ status: string; status_code: string }> {
  const token = await getOmAccessToken();

  const response = await fetch(
    `${OM_BASE_URL}/${OM_API_VERSION}/webpayment/${payToken}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );

  const data = (await response.json()) as OmStatusResponse;

  return {
    status: mapOmStatus(data.status_code),
    status_code: data.status_code,
  };
}

/**
 * Traite le callback Orange Money (notification push).
 */
export async function handleOrangeMoneyCallback(
  body: Record<string, unknown>,
): Promise<void> {
  const orderId = body.order_id as string;
  const payToken = body.pay_token as string;
  const status = body.status as string;

  logger.info({ orderId, payToken, status }, "Callback Orange Money reçu");

  // Mapper le statut Orange Money vers notre statut
  const mappedStatus = mapOmStatus(status);

  // Trouver le paiement
  const payment = await prisma.payment.findFirst({
    where: { providerTxId: payToken },
  });

  if (!payment) {
    logger.warn({ payToken }, "Paiement inconnu pour ce callback");
    return;
  }

  // Mettre à jour le statut
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: mappedStatus,
      ...(mappedStatus === "PAID" ? { paidAt: new Date() } : {}),
      ...(mappedStatus === "REFUNDED" ? { refundedAt: new Date() } : {}),
    },
  });

  // Si le paiement est confirmé, confirmer la réservation
  if (mappedStatus === "PAID") {
    await prisma.rentalBooking.update({
      where: { id: payment.bookingId },
      data: { status: "CONFIRMEE" },
    });

    // Créditer les points de fidélité
    await creditLoyaltyPoints(payment.userId, 10, "EARN_BOOKING", payment.bookingId);

    // Activer le code de parrainage si applicable
    const referral = await prisma.referral.findFirst({
      where: { referredId: payment.userId, status: "PENDING" },
    });
    if (referral) {
      await prisma.referral.update({
        where: { id: referral.id },
        data: { status: "ACTIVE", activatedAt: new Date() },
      });
      // Bonus au parrain
      await creditLoyaltyPoints(referral.referrerId, 50, "EARN_REFERRAL", referral.id);
    }
  }
}

/**
 * Rembourse un paiement.
 */
export async function refundPayment(paymentId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.status !== "PAID") {
    throw new Error("Paiement non remboursable");
  }

  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "REFUNDED", refundedAt: new Date() },
  });

  await prisma.rentalBooking.update({
    where: { id: payment.bookingId },
    data: { status: "ANNULEE" },
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function getOmAccessToken(): Promise<string> {
  const response = await fetch(
    `${OM_BASE_URL}/${OM_API_VERSION}/oauth/v3/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${env.OM_APP_KEY}:${env.OM_APP_SECRET}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
  );

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

function mapOmStatus(omStatus: string): string {
  const statusMap: Record<string, string> = {
    INITIATED: "PENDING",
    PENDING: "PENDING",
    SUCCESS: "PAID",
    FAILED: "FAILED",
    EXPIRED: "FAILED",
    REFUNDED: "REFUNDED",
  };
  return statusMap[omStatus] ?? "PENDING";
}

/**
 * Crédite des points de fidélité.
 */
async function creditLoyaltyPoints(
  userId: string,
  points: number,
  type: string,
  referenceId: string,
): Promise<void> {
  // Calculer le solde actuel
  const lastTx = await prisma.loyaltyTransaction.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const currentBalance = lastTx?.balance ?? 0;
  const newBalance = currentBalance + points;

  await prisma.loyaltyTransaction.create({
    data: {
      userId,
      points,
      type,
      referenceId,
      balance: newBalance,
    },
  });

  // Mettre à jour le compteur sur l'utilisateur
  await prisma.user.update({
    where: { id: userId },
    data: { referralPoints: newBalance },
  });

  logger.info({ userId, points, type, newBalance }, "Points de fidélité crédités");
}
