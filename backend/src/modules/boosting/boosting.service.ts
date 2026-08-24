/**
 * Service de Boosting Véhicules.
 *
 * Niveaux :
 * - BASIC (gratuit) : visibilité standard
 * - PREMIUM (payant) : +50% de visibilité, badge doré
 * - VIP (payant) : +100% de visibilité, badge violet, top des résultats
 *
 * Tri des résultats : VIP > PREMIUM > BASIC > NON_BOOSTED
 */

import { prisma } from "../../lib/prisma.js";
import { logger } from "../../lib/logger.js";

// ── Types ────────────────────────────────────────────────────────────────

export type BoostLevel = "BASIC" | "PREMIUM" | "VIP";

export interface BoostPlan {
  level: BoostLevel;
  durationDays: number;
  priceGnf: number;
  label: string;
  features: string[];
}

export const BOOST_PLANS: BoostPlan[] = [
  {
    level: "BASIC",
    durationDays: 7,
    priceGnf: 0,
    label: "Basique",
    features: ["Visibilité standard", "Badge Basic"],
  },
  {
    level: "PREMIUM",
    durationDays: 7,
    priceGnf: 50000,
    label: "Premium",
    features: ["+50% de visibilité", "Badge doré", "Mise en avant dans les résultats"],
  },
  {
    level: "VIP",
    durationDays: 7,
    priceGnf: 150000,
    label: "VIP",
    features: ["+100% de visibilité", "Badge violet", "Top des résultats", "Page d'accueil"],
  },
];

export interface VehicleBoostInfo {
  id: string;
  vehicleId: string;
  level: BoostLevel;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
}

// ── Service ──────────────────────────────────────────────────────────────

/**
 * Active un boost pour un véhicule.
 */
export async function activateBoost(params: {
  vehicleId: string;
  userId: string;
  level: BoostLevel;
  paymentId?: string;
}): Promise<VehicleBoostInfo> {
  const { vehicleId, userId, level, paymentId } = params;

  const plan = BOOST_PLANS.find((p) => p.level === level);
  if (!plan) throw new Error("Niveau de boost invalide");

  // Vérifier que le véhicule appartient à l'utilisateur
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle || vehicle.ownerId !== userId) {
    throw new Error("Véhicule non trouvé ou accès refusé");
  }

  // Désactiver les boosts existants
  await prisma.vehicleBoost.updateMany({
    where: { vehicleId, status: "ACTIVE" },
    data: { status: "EXPIRED" },
  });

  const now = new Date();
  const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const boost = await prisma.vehicleBoost.create({
    data: {
      vehicleId,
      userId,
      level,
      startDate: now,
      endDate,
      price: plan.priceGnf,
      status: "ACTIVE",
      paymentId: paymentId ?? undefined,
    },
  });

  logger.info({ boostId: boost.id, vehicleId, level }, "Boost activé");

  return {
    id: boost.id,
    vehicleId,
    level,
    startDate: now,
    endDate,
    isActive: true,
  };
}

/**
 * Récupère le boost actif d'un véhicule.
 */
export async function getVehicleBoost(vehicleId: string): Promise<VehicleBoostInfo | null> {
  const boost = await prisma.vehicleBoost.findFirst({
    where: { vehicleId, status: "ACTIVE", endDate: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!boost) return null;

  return {
    id: boost.id,
    vehicleId: boost.vehicleId,
    level: boost.level as BoostLevel,
    startDate: boost.startDate,
    endDate: boost.endDate,
    isActive: true,
  };
}

/**
 * Récupère les boosts d'un propriétaire.
 */
export async function getOwnerBoosts(userId: string): Promise<VehicleBoostInfo[]> {
  const boosts = await prisma.vehicleBoost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return boosts.map((b) => ({
    id: b.id,
    vehicleId: b.vehicleId,
    level: b.level as BoostLevel,
    startDate: b.startDate,
    endDate: b.endDate,
    isActive: b.status === "ACTIVE" && b.endDate > new Date(),
  }));
}

/**
 * Annule un boost actif.
 */
export async function cancelBoost(boostId: string, userId: string): Promise<void> {
  const boost = await prisma.vehicleBoost.findUnique({ where: { id: boostId } });
  if (!boost || boost.userId !== userId) {
    throw new Error("Boost non trouvé ou accès refusé");
  }

  await prisma.vehicleBoost.update({
    where: { id: boostId },
    data: { status: "CANCELLED" },
  });

  logger.info({ boostId }, "Boost annulé");
}

/**
 * Nettoie les boosts expirés (à appeler via cron).
 */
export async function cleanupExpiredBoosts(): Promise<number> {
  const result = await prisma.vehicleBoost.updateMany({
    where: { status: "ACTIVE", endDate: { lt: new Date() } },
    data: { status: "EXPIRED" },
  });

  if (result.count > 0) {
    logger.info({ count: result.count }, "Boosts expirés nettoyés");
  }

  return result.count;
}

/**
 * Applique le tri par boost dans les résultats de recherche.
 * Les véhicules VIP apparaissent d'abord, puis PREMIUM, puis les autres.
 */
export function boostSortKey(level: string | null): number {
  switch (level) {
    case "VIP": return 0;
    case "PREMIUM": return 1;
    case "BASIC": return 2;
    default: return 3;
  }
}
