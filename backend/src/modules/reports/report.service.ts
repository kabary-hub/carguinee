import { prisma } from "../../lib/prisma.js";

/**
 * Crée un signalement
 */
export async function createReport(
  reporterId: string,
  targetId: string,
  targetType: string,
  reason: string,
  description?: string,
) {
  // Vérifier que la cible existe
  if (targetType === "VEHICLE") {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: targetId } });
    if (!vehicle) throw new Error("Véhicule introuvable.");
  } else if (targetType === "USER") {
    const user = await prisma.user.findUnique({ where: { id: targetId } });
    if (!user) throw new Error("Utilisateur introuvable.");
  }

  // Vérifier que l'utilisateur n'a pas déjà signalé cette cible
  const existing = await prisma.report.findFirst({
    where: { reporterId, targetId, targetType, status: "PENDING" },
  });

  if (existing) {
    throw new Error("Vous avez déjà signalé ce contenu.");
  }

  return prisma.report.create({
    data: {
      reporterId,
      targetId,
      targetType,
      reason,
      description,
    },
  });
}

/**
 * Récupère tous les signalements (admin)
 */
export async function listReports(options?: {
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 20;
  const skip = (page - 1) * pageSize;

  const where = options?.status
    ? { status: options.status }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.report.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    }),
    prisma.report.count({ where }),
  ]);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
}

/**
 * Résout un signalement (admin)
 */
export async function resolveReport(
  reportId: string,
  resolverId: string,
  status: "RESOLVED" | "DISMISSED",
) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });

  if (!report) {
    throw new Error("Signalement introuvable.");
  }

  if (report.status !== "PENDING") {
    throw new Error("Ce signalement a déjà été traité.");
  }

  return prisma.report.update({
    where: { id: reportId },
    data: {
      status,
      resolvedAt: new Date(),
      resolverId,
    },
  });
}

// ── Actions admin sur les signalements ───────────────────────────────────────

/**
 * Bannir l'utilisateur signalé (désactiver son compte)
 */
export async function banReportedUser(reportId: string, resolverId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Signalement introuvable.");
  if (report.targetType !== "USER") {
    throw new Error("Ce signalement ne concerne pas un utilisateur.");
  }

  const user = await prisma.user.findUnique({ where: { id: report.targetId }, select: { id: true, isActive: true } });
  if (!user) throw new Error("Utilisateur introuvable.");

  // Désactiver l'utilisateur
  await prisma.user.update({
    where: { id: report.targetId },
    data: { isActive: false },
  });

  // Marquer le signalement comme résolu
  return prisma.report.update({
    where: { id: reportId },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolverId },
  });
}

/**
 * Suspendre le véhicule signalé (archiver sa publication)
 */
export async function suspendReportedVehicle(reportId: string, resolverId: string) {
  const report = await prisma.report.findUnique({ where: { id: reportId } });
  if (!report) throw new Error("Signalement introuvable.");
  if (report.targetType !== "VEHICLE") {
    throw new Error("Ce signalement ne concerne pas un véhicule.");
  }

  const vehicle = await prisma.vehicle.findUnique({ where: { id: report.targetId }, select: { id: true, publicationStatus: true } });
  if (!vehicle) throw new Error("Véhicule introuvable.");

  // Archiver le véhicule
  await prisma.vehicle.update({
    where: { id: report.targetId },
    data: { publicationStatus: "ARCHIVEE" },
  });

  // Marquer le signalement comme résolu
  return prisma.report.update({
    where: { id: reportId },
    data: { status: "RESOLVED", resolvedAt: new Date(), resolverId },
  });
}
