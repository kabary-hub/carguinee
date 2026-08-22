import { prisma } from "../../lib/prisma.js";
import type { OwnerRequestInput } from "../auth/auth.schemas.js";

export async function createOwnerRequest(userId: string, input: OwnerRequestInput) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user || !user.isActive) {
    throw new Error("Utilisateur introuvable.");
  }

  if (user.role !== "CLIENT") {
    throw new Error("Seuls les clients peuvent demander le rôle propriétaire.");
  }

  const pendingRequest = await prisma.ownerRequest.findFirst({
    where: {
      userId,
      status: "PENDING",
    },
  });

  if (pendingRequest) {
    throw new Error("Une demande propriétaire est déjà en attente.");
  }

  return prisma.ownerRequest.create({
    data: {
      userId,
      motivation: input.motivation || null,
    },
  });
}

export async function listMyOwnerRequests(userId: string) {
  return prisma.ownerRequest.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      reviewedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

export async function cancelOwnerRequest(userId: string, requestId: string) {
  const ownerRequest = await prisma.ownerRequest.findFirst({
    where: {
      id: requestId,
      userId,
      status: "PENDING",
    },
  });

  if (!ownerRequest) {
    throw new Error("Demande en attente introuvable.");
  }

  return prisma.ownerRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED" },
  });
}

export async function listPendingOwnerRequests() {
  return prisma.ownerRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      user: {
        select: {
          id: true,
          phone: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
        },
      },
    },
  });
}

export async function approveOwnerRequest(requestId: string, adminId: string) {
  return prisma.$transaction(async (transaction) => {
    const ownerRequest = await transaction.ownerRequest.findFirst({
      where: {
        id: requestId,
        status: "PENDING",
      },
    });

    if (!ownerRequest) {
      throw new Error("Demande propriétaire en attente introuvable.");
    }

    const now = new Date();

    const updatedRequest = await transaction.ownerRequest.update({
      where: { id: requestId },
      data: {
        status: "APPROVED",
        reviewedById: adminId,
        reviewedAt: now,
      },
    });

    await transaction.user.update({
      where: { id: ownerRequest.userId },
      data: { role: "PROPRIETAIRE" },
    });

    return updatedRequest;
  });
}

export async function rejectOwnerRequest(
  requestId: string,
  adminId: string,
  rejectionReason: string,
) {
  const reason = rejectionReason.trim();

  if (!reason) {
    throw new Error("Le motif du rejet est obligatoire.");
  }

  const ownerRequest = await prisma.ownerRequest.findFirst({
    where: {
      id: requestId,
      status: "PENDING",
    },
  });

  if (!ownerRequest) {
    throw new Error("Demande propriétaire en attente introuvable.");
  }

  return prisma.ownerRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      rejectionReason: reason,
      reviewedById: adminId,
      reviewedAt: new Date(),
    },
  });
}
