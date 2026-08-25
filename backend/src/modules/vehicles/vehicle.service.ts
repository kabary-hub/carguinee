import type { AuthRole } from "../../types/express.js";
import { prisma } from "../../lib/prisma.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
  VehicleListQuery,
} from "./vehicle.schemas.js";

/**
 * Coordonnées GPS précises de chaque quartier de Conakry.
 * Sources : OpenStreetMap Nominatim + Wikipedia.
 * Structure : { KALOUM: { "Boulbinet": { lat, lon }, ... }, ... }
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const quartiersCoords: Record<string, Record<string, { lat: number; lon: number }>> =
  JSON.parse(readFileSync(join(__dirname, "../../../data/quartiers-coordinates.json"), "utf-8"));

/**
 * Coordonnées GPS par commune (fallback si le quartier n'est pas trouvé).
 */
const COMMUNE_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  KALOUM:  { latitude: 9.50917,  longitude: -13.71222 },
  DIXINN:  { latitude: 9.5511,   longitude: -13.6731 },
  MATAM:   { latitude: 9.5667,   longitude: -13.6333 },
  MATOTO:  { latitude: 9.57694,  longitude: -13.61194 },
  RATOMA:  { latitude: 9.583,    longitude: -13.650 },
};

/**
 * Renvoie les coordonnées GPS d'un quartier dans une commune.
 * Cherche d'abord par nom de quartier (match partiel), puis fallback commune.
 */
function getLocationCoordinates(commune: string, quartier?: string) {
  const communeQuartiers = quartiersCoords[commune];
  if (communeQuartiers && quartier) {
    // Match exact d'abord
    const exact = communeQuartiers[quartier];
    if (exact) return { latitude: exact.lat, longitude: exact.lon };
    // Match partiel (le nom du quartier contient une clé ou vice versa)
    const qLower = quartier.toLowerCase();
    for (const [key, coords] of Object.entries(communeQuartiers)) {
      if (qLower.includes(key.toLowerCase()) || key.toLowerCase().includes(qLower)) {
        return { latitude: coords.lat, longitude: coords.lon };
      }
    }
  }
  // Fallback : centre de la commune
  return COMMUNE_COORDINATES[commune] || null;
}

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
  const locationCoords = getLocationCoordinates(input.commune, input.quartier);
  return prisma.vehicle.create({
    data: {
      ...rest,
      ownerId,
      publicationStatus: "BROUILLON",
      // Assignation automatique des coordonnées GPS basée sur la commune et le quartier
      ...(locationCoords && !rest.latitude && !rest.longitude ? locationCoords : {}),
      ...(visiteTechniqueValideJusquA ? { visiteTechniqueValideJusquA: new Date(visiteTechniqueValideJusquA) } : {}),
      ...(assuranceValideJusquA ? { assuranceValideJusquA: new Date(assuranceValideJusquA) } : {}),
    },
    include: vehicleInclude,
  });
}

type VehicleWhere = Record<string, unknown>;

/**
 * Renvoie les IDs des véhicules qui ont au moins un favori
 * créé par un utilisateur ADMIN. Utilisé pour les afficher en priorité
 * dans le catalogue public.
 */
async function getAdminFavoritedVehicleIds(
  baseWhere: VehicleWhere,
): Promise<string[]> {
  const adminIds = (
    await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    })
  ).map((u) => u.id);

  if (adminIds.length === 0) return [];

  const rows = await prisma.favorite.findMany({
    where: { userId: { in: adminIds } },
    select: { vehicleId: true },
  });

  const allAdminFavIds = [...new Set(rows.map((r) => r.vehicleId))];
  if (allAdminFavIds.length === 0) return [];

  // On ne garde que ceux qui passent le filtre WHERE courant
  const matching = await prisma.vehicle.findMany({
    where: { ...baseWhere, id: { in: allAdminFavIds } },
    select: { id: true },
  });

  return matching.map((v) => v.id);
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

  // ── Favoris admin : on les affiche en premier ─────────────────────────────
  const adminFavoritedIds = await getAdminFavoritedVehicleIds(where);

  const total = await prisma.vehicle.count({ where });

  if (adminFavoritedIds.length === 0) {
    // Aucun favori admin → requête classique
    const items = await prisma.vehicle.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: vehicleInclude,
    });

    return {
      items: items.map((v) => ({ ...v, adminFavorited: false })),
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  }

  // Deux requêtes : favoris admin d'abord, puis le reste
  const whereAdminFav = { ...where, id: { in: adminFavoritedIds } };
  const whereRegular = { ...where, id: { notIn: adminFavoritedIds } };

  const adminFavTotal = await prisma.vehicle.count({ where: whereAdminFav });

  const adminFavsSkip = Math.min(skip, adminFavTotal);
  const adminFavsToTake = Math.min(pageSize, Math.max(0, adminFavTotal - adminFavsSkip));
  const regularSkip = Math.max(0, skip - adminFavTotal);
  const regularToTake = Math.max(0, pageSize - adminFavsToTake);

  const [adminFavItems, regularItems] = await Promise.all([
    prisma.vehicle.findMany({
      where: whereAdminFav,
      skip: adminFavsSkip,
      take: adminFavsToTake,
      orderBy: { createdAt: "desc" },
      include: vehicleInclude,
    }),
    regularToTake > 0
      ? prisma.vehicle.findMany({
          where: whereRegular,
          skip: regularSkip,
          take: regularToTake,
          orderBy: { createdAt: "desc" },
          include: vehicleInclude,
        })
      : Promise.resolve([]),
  ]);

  return {
    items: [
      ...adminFavItems.map((v) => ({ ...v, adminFavorited: true })),
      ...regularItems.map((v) => ({ ...v, adminFavorited: false })),
    ],
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
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

  // Vérifier si un admin a mis ce véhicule en favori
  const adminFav = await prisma.favorite.findFirst({
    where: {
      vehicleId,
      user: { role: "ADMIN" },
    },
    select: { id: true },
  });

  return { ...vehicle, adminFavorited: !!adminFav };
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

  // Auto-assigner les coordonnées GPS si la commune/quartier change et qu'aucune coordonnée n'est fournie
  let coordsUpdate = {};
  if ((rest.commune || rest.quartier) && !rest.latitude && !rest.longitude) {
    const commune = rest.commune || currentVehicle.commune;
    const quartier = rest.quartier || currentVehicle.quartier;
    const locationCoords = getLocationCoordinates(commune, quartier);
    if (locationCoords) coordsUpdate = locationCoords;
  }

  return prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      ...rest,
      ...coordsUpdate,
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

/**
 * Liste admin : permet de filtrer par publicationStatus.
 * Réservé aux admins (protégé par requireRoles dans les routes).
 */
export async function listAdminVehicles(
  options: { publicationStatus?: string; page?: number; pageSize?: number } = {},
) {
  const { publicationStatus, page = 1, pageSize = 50 } = options;
  const skip = (page - 1) * pageSize;

  const validStatuses = ["BROUILLON", "EN_ATTENTE_VALIDATION", "PUBLIEE", "REJETEE", "ARCHIVEE"];
  const where = publicationStatus && validStatuses.includes(publicationStatus)
    ? { publicationStatus: publicationStatus as "BROUILLON" | "EN_ATTENTE_VALIDATION" | "PUBLIEE" | "REJETEE" | "ARCHIVEE" }
    : {};

  const [items, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      include: vehicleInclude,
    }),
    prisma.vehicle.count({ where }),
  ]);

  return {
    items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  };
}

