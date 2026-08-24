/**
 * Service de parrainage et points de fidélité.
 *
 * Règles :
 * - Parrain crée un code unique (ex: "AIDARA-X7K2")
 * - Parrainé s'inscrit avec le code → Referral PENDING
 * - Parrainé fait sa 1ère réservation payée → Referral ACTIVE
 * - Parrain reçoit 50 points, Parrainé reçoit 10 points
 * - 10 points = 1 réservation, 100 points = 10% de réduction
 */

import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";

// ── Types ────────────────────────────────────────────────────────────────

export interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  pendingReferrals: number;
  totalPointsEarned: number;
  currentBalance: number;
  referralCode: string | null;
  discountAvailable: boolean;
  nextDiscountAt: number; // points restants pour la prochaine réduction
}

// ── Service ──────────────────────────────────────────────────────────────

/**
 * Génère un code de parrainage unique pour un utilisateur.
 */
export async function generateReferralCode(userId: string): Promise<string> {
  // Vérifier si l'utilisateur a déjà un code
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (user?.referralCode) {
    return user.referralCode;
  }

  // Générer un code unique
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Sans I/O/0/1 pour éviter la confusion
  let code: string;
  let attempts = 0;

  do {
    const suffix = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    const name = (user?.lastName ?? "USER").toUpperCase().slice(0, 6);
    code = `${name}-${suffix}`;
    attempts++;
  } while (attempts < 10);

  await prisma.user.update({
    where: { id: userId },
    data: { referralCode: code },
  });

  logger.info({ userId, code }, "Code de parrainage généré");
  return code;
}

/**
 * Vérifie et enregistre un parrainage lors de l'inscription.
 */
export async function applyReferralCode(
  referredUserId: string,
  referralCode: string,
): Promise<{ success: boolean; message: string }> {
  // Trouver le parrain
  const referrer = await prisma.user.findFirst({
    where: { referralCode, isActive: true, isBanned: false },
  });

  if (!referrer) {
    return { success: false, message: "Code de parrainage invalide." };
  }

  if (referrer.id === referredUserId) {
    return { success: false, message: "Vous ne pouvez pas vous parrainer vous-même." };
  }

  // Vérifier qu'on ne s'est pas déjà fait parrainer
  const existingReferral = await prisma.referral.findFirst({
    where: { referredId: referredUserId },
  });

  if (existingReferral) {
    return { success: false, message: "Vous avez déjà utilisé un code de parrainage." };
  }

  // Créer le referral
  await prisma.referral.create({
    data: {
      referrerId: referrer.id,
      referredId: referredUserId,
      code: referralCode,
      status: "PENDING",
    },
  });

  // Créditer les 10 points au parrainé
  await creditLoyaltyPoints(referredUserId, 10, "EARN_REFERRAL", referrer.id);

  logger.info({ referrerId: referrer.id, referredId: referredUserId }, "Parrainage enregistré");
  return { success: true, message: "Code de parrainage appliqué avec succès !" };
}

/**
 * Active un parrainage quand le parrainé fait sa 1ère réservation.
 * (Appelé depuis payment.service.ts quand le paiement est confirmé)
 */
export async function activateReferral(referredId: string): Promise<void> {
  const referral = await prisma.referral.findFirst({
    where: { referredId, status: "PENDING" },
  });

  if (!referral) return;

  await prisma.referral.update({
    where: { id: referral.id },
    data: { status: "ACTIVE", activatedAt: new Date(), bonusAwarded: 50 },
  });

  // Bonus 50 points au parrain
  await creditLoyaltyPoints(referral.referrerId, 50, "EARN_REFERRAL", referral.id);

  logger.info({ referralId: referral.id, referrerId: referral.referrerId }, "Parrainage activé, 50 points crédités");
}

/**
 * Récupère les stats de parrainage d'un utilisateur.
 */
export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  const [totalReferrals, activeReferrals, pendingReferrals, lastTx] = await Promise.all([
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, status: "ACTIVE" } }),
    prisma.referral.count({ where: { referrerId: userId, status: "PENDING" } }),
    prisma.loyaltyTransaction.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const currentBalance = lastTx?.balance ?? 0;

  return {
    totalReferrals,
    activeReferrals,
    pendingReferrals,
    totalPointsEarned: user?.referralPoints ?? 0,
    currentBalance,
    referralCode: user?.referralCode ?? null,
    discountAvailable: currentBalance >= 100,
    nextDiscountAt: Math.max(0, 100 - (currentBalance % 100)),
  };
}

/**
 * Récupère l'historique des transactions de fidélité.
 */
export async function getLoyaltyHistory(
  userId: string,
  page = 1,
  pageSize = 20,
): Promise<{ items: Array<{ id: string; points: number; type: string; balance: number; createdAt: Date }>; total: number }> {
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.loyaltyTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: { id: true, points: true, type: true, balance: true, createdAt: true },
    }),
    prisma.loyaltyTransaction.count({ where: { userId } }),
  ]);

  return { items, total };
}

/**
 * Applique une réduction avec les points de fidélité.
 * Retourne le pourcentage de réduction applicable.
 */
export async function calculateDiscount(
  userId: string,
): Promise<{ discountPercent: number; pointsUsed: number; remainingPoints: number }> {
  const lastTx = await prisma.loyaltyTransaction.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const balance = lastTx?.balance ?? 0;

  if (balance < 100) {
    return { discountPercent: 0, pointsUsed: 0, remainingPoints: balance };
  }

  // 100 points = 10% de réduction, 200 = 20%, max 30%
  const blocks = Math.floor(balance / 100);
  const discountPercent = Math.min(blocks * 10, 30);
  const pointsUsed = blocks * 100;

  return {
    discountPercent,
    pointsUsed,
    remainingPoints: balance - pointsUsed,
  };
}

// ── Helpers ──────────────────────────────────────────────────────────────

async function creditLoyaltyPoints(
  userId: string,
  points: number,
  type: string,
  referenceId: string,
): Promise<void> {
  const lastTx = await prisma.loyaltyTransaction.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const currentBalance = lastTx?.balance ?? 0;
  const newBalance = currentBalance + points;

  await prisma.loyaltyTransaction.create({
    data: { userId, points, type, referenceId, balance: newBalance },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { referralPoints: newBalance },
  });

  logger.info({ userId, points, type, newBalance }, "Points de fidélité crédités");
}
