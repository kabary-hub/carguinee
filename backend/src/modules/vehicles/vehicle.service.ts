import type { AuthRole } from "../../types/express.js";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleListQuery,
} from "./vehicle.schemas.js";

const vehicleInclude = {
  photos: {
    orderBy: { sortOrder: "asc" as const },
  },
  owner: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      role: true,
      averageRating: true,
      identityVerified: true,
    },
  },
  conditionReport: true,
  _count: {
    select: {
      reviews: true,
      favorites: true,
      rentalBookings: true,
    },
  },
};

export async function createVehicle(ownerId: string, input: CreateVehicleInput) {
  const { visiteTechniqueValideJusquA, assuranceValideJusquA, ...rest } = input;
  return prisma.vehicle.create({
    data: {
      ...rest,
      ownerId,
      publicationStatus: "BROUILLON",
      ...(visiteTechniqueValideJusquA ? { visiteTechniqueValideJusquA: new Date(visiteTechniqueValideJusquA) } : {}),
      ...(assuranceValideJusquA ? { assuranceValideJusquA: new Date(assuranceValideJusquA) } : {}),
    },
    include: vehicleInclude,
  });
}

export async function listPublicVehicles(query: VehicleListQuery) {
  const page = query.page;
  const pageSize = query.pageSize;
  const skip = (page - 1) * pageSize;

  const modeFilters = {
    ...(query.supportsRental ? { supportsRental: query.supportsRental === "true" } : {}),
    ...(query.supportsSale ? { supportsSale: query.supportsSale === "true" } : {}),
  };

  const priceConditions = [];

  if (query.minPriceGnf !== undefined || query.maxPriceGnf !== undefined) {
    const rentalPrice = {
      ...(query.minPriceGnf !== undefined ? { gte: query.minPriceGnf } : {}),
      ...(query.maxPriceGnf !== undefined ? { lte: query.maxPriceGnf } : {}),
    };

    priceConditions.push({ dailyRentalPriceGnf: rentalPrice });
    priceConditions.push({ salePriceGnf: rentalPrice });
  }

  const searchConditions = query.search
    ? [
        {
          OR: [
            { brand: { contains: query.search, mode: "insensitive" as const } },
            { model: { contains: query.search, mode: "insensitive" as const } },
          ],
        },
      ]
    : [];

  const where = {
    publicationStatus: "PUBLIEE" as const,
    ...(query.commune ? { commune: query.commune } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...modeFilters,
    AND: [
      ...searchConditions,
      ...(priceConditions.length > 0 ? [{ OR: priceConditions }] : []),
    ],
  };

  const [items, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: vehicleInclude,
    }),
    prisma.vehicle.count({ where }),
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

export async function listOwnerVehicles(ownerId: string) {
  return prisma.vehicle.findMany({
    where: { ownerId },
    orderBy: { updatedAt: "desc" },
    include: vehicleInclude,
  });
}

export async function getVehicleById(
  vehicleId: string,
  viewerId?: string,
  viewerRole?: AuthRole,
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: vehicleInclude,
  });

  if (!vehicle) {
    throw new Error("Véhicule introuvable.");
  }

  const canViewPrivate =
    viewerRole === "ADMIN" || (viewerId !== undefined && viewerId === vehicle.ownerId);

  if (vehicle.publicationStatus !== "PUBLIEE" && !canViewPrivate) {
    throw new Error("Véhicule introuvable.");
  }

  return vehicle;
}

async function ensureCanManageVehicle(vehicleId: string, userId: string, role: AuthRole) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle) {
    throw new Error("Véhicule introuvable.");
  }

  if (role !== "ADMIN" && vehicle.ownerId !== userId) {
    throw new Error("Vous ne pouvez pas gérer ce véhicule.");
  }

  return vehicle;
}

export async function updateVehicle(
  vehicleId: string,
  userId: string,
  role: AuthRole,
  input: UpdateVehicleInput,
) {
  const currentVehicle = await ensureCanManageVehicle(vehicleId, userId, role);

  const nextStatus =
    role !== "ADMIN" && currentVehicle.publicationStatus === "PUBLIEE"
      ? "EN_ATTENTE_VALIDATION"
      : currentVehicle.publicationStatus;

  const { visiteTechniqueValideJusquA, assuranceValideJusquA, ...rest } = input;

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...rest,
      ...(visiteTechniqueValideJusquA !== undefined
        ? { visiteTechniqueValideJusquA: visiteTechniqueValideJusquA ? new Date(visiteTechniqueValideJusquA) : null }
        : {}),
      ...(assuranceValideJusquA !== undefined
        ? { assuranceValideJusquA: assuranceValideJusquA ? new Date(assuranceValideJusquA) : null }
        : {}),
      publicationStatus: nextStatus,
    },
    include: vehicleInclude,
  });
}

export async function deleteVehicle(vehicleId: string, userId: string, role: AuthRole) {
  const vehicle = await ensureCanManageVehicle(vehicleId, userId, role);

  // Un propriétaire ne peut supprimer que ses brouillons, en attente, ou rejetés
  if (role !== "ADMIN") {
    if (!["BROUILLON", "EN_ATTENTE_VALIDATION", "REJETEE"].includes(vehicle.publicationStatus)) {
      throw new Error("Vous ne pouvez supprimer que les brouillons, les véhicules en attente et les véhicules rejetés.");
    }
    // Vérifier qu'il n'y a pas de réservation active
    const activeBookings = await prisma.rentalBooking.count({
      where: {
        vehicleId,
        status: { in: ["EN_ATTENTE", "CONFIRMEE", "EN_COURS"] },
      },
    });
    if (activeBookings > 0) {
      throw new Error("Ce véhicule a des réservations actives et ne peut pas être supprimé.");
    }
  }

  await prisma.vehicle.delete({ where: { id: vehicleId } });
}

export async function archiveVehicle(vehicleId: string, userId: string, role: AuthRole) {
  await ensureCanManageVehicle(vehicleId, userId, role);

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: { publicationStatus: "ARCHIVEE" },
    include: vehicleInclude,
  });
}

export async function restoreVehicle(vehicleId: string, userId: string, role: AuthRole) {
  await ensureCanManageVehicle(vehicleId, userId, role);

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: { publicationStatus: "BROUILLON" },
    include: vehicleInclude,
  });
}
export async function submitVehicleForValidation(vehicleId: string, ownerId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      _count: {
        select: { photos: true },
      },
    },
  });

  if (!vehicle || vehicle.ownerId !== ownerId) {
    throw new Error("Véhicule introuvable ou non autorisé.");
  }

  if (!["BROUILLON", "REJETEE"].includes(vehicle.publicationStatus)) {
    throw new Error("Ce véhicule ne peut pas être soumis dans son état actuel.");
  }

  // Un véhicule doit comporter au moins une photo avant soumission :
  // la publication par l'administrateur l'exige aussi, autant le signaler
  // au propriétaire dès la soumission.
  if (vehicle._count.photos < 1) {
    throw new Error("Ajoutez au moins une photo avant de soumettre le véhicule.");
  }

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      publicationStatus: "EN_ATTENTE_VALIDATION",
      rejectionReason: null,
      reviewedById: null,
      reviewedAt: null,
    },
    include: vehicleInclude,
  });
}

export async function listPendingVehicleValidations() {
  return prisma.vehicle.findMany({
    where: { publicationStatus: "EN_ATTENTE_VALIDATION" },
    orderBy: { createdAt: "asc" },
    include: {
      ...vehicleInclude,
      photos: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });
}

export async function approveVehicle(vehicleId: string, adminId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    include: {
      _count: {
        select: { photos: true },
      },
    },
  });

  if (!vehicle || vehicle.publicationStatus !== "EN_ATTENTE_VALIDATION") {
    throw new Error("Véhicule en attente introuvable.");
  }

  if (vehicle._count.photos < 1) {
    throw new Error("Au moins une photo est obligatoire avant publication.");
  }

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      publicationStatus: "PUBLIEE",
      reviewedById: adminId,
      reviewedAt: new Date(),
      rejectionReason: null,
    },
    include: vehicleInclude,
  });
}

export async function rejectVehicle(
  vehicleId: string,
  adminId: string,
  rejectionReason: string,
) {
  const reason = rejectionReason.trim();

  if (!reason) {
    throw new Error("Le motif du rejet est obligatoire.");
  }

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
  });

  if (!vehicle || vehicle.publicationStatus !== "EN_ATTENTE_VALIDATION") {
    throw new Error("Véhicule en attente introuvable.");
  }

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      publicationStatus: "REJETEE",
      reviewedById: adminId,
      reviewedAt: new Date(),
      rejectionReason: reason,
    },
    include: vehicleInclude,
  });
}

