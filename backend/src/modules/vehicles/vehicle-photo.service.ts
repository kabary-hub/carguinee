import fs from "node:fs/promises";
import path from "node:path";
import type { PublicationStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { getVehiclePhotoUrl } from "../../middleware/vehicle-upload.js";
import { photoLimitError } from "./photo-limits.js";

/**
 * Surface minimale du client Prisma utilisée par ce service.
 * Déclarée structurellement pour permettre l'injection d'un faux client
 * dans les tests, sans base de données ni schéma Prisma réel.
 */
export type PhotoPrismaClient = {
  vehicle: {
    findUnique: (args: {
      where: { id: string };
      include: { _count: { select: { photos: true } } };
    }) => Promise<{
      id: string;
      ownerId: string;
      publicationStatus: PublicationStatus;
      _count: { photos: number };
    } | null>;
    update: (args: {
      where: { id: string };
      data: { publicationStatus: PublicationStatus };
    }) => Promise<unknown>;
  };
  vehiclePhoto: {
    createMany: (args: {
      data: {
        vehicleId: string;
        url: string;
        storageKey: string;
        sortOrder: number;
        sizeBytes: number;
      }[];
    }) => Promise<{ count: number }>;
    findFirst: (args: {
      where: {
        id: string;
        vehicleId: string;
        vehicle: { ownerId: string };
      };
      include: { vehicle: { select: { publicationStatus: true } } };
    }) => Promise<{
      id: string;
      storageKey: string;
      vehicle: { publicationStatus: PublicationStatus };
    } | null>;
    delete: (args: { where: { id: string } }) => Promise<unknown>;
  };
};

/**
 * Remet un véhicule en attente de validation après une modification par son
 * propriétaire (ajout ou suppression de photo) : toute modification d'un
 * véhicule déjà publié doit suivre à nouveau le workflow de validation.
 * Ne change rien si le statut n'est pas PUBLIEE ou si l'utilisateur est admin.
 */
function nextStatusAfterOwnerChange(
  publicationStatus: PublicationStatus,
  actorRole: string | undefined,
): PublicationStatus | undefined {
  if (publicationStatus === "PUBLIEE" && actorRole !== "ADMIN") {
    return "EN_ATTENTE_VALIDATION";
  }
  return undefined;
}

export async function addVehiclePhotos(
  vehicleId: string,
  ownerId: string,
  files: Express.Multer.File[],
  actorRole?: string,
  prismaClient: PhotoPrismaClient = prisma,
) {
  const vehicle = await prismaClient.vehicle.findUnique({
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

  // Limite stricte : 8 photos maximum par véhicule, photos existantes incluses.
  const limitError = photoLimitError(vehicle._count.photos, files.length);
  if (limitError) {
    throw new Error(limitError);
  }

  const photos = await prismaClient.vehiclePhoto.createMany({
    data: files.map((file, index) => ({
      vehicleId,
      url: getVehiclePhotoUrl(file.filename),
      storageKey: path.relative(process.cwd(), file.path),
      sortOrder: vehicle._count.photos + index,
      sizeBytes: file.size,
    })),
  });

  // Un véhicule publié modifié (ajout de photo) repasse en validation.
  const publicationStatus = nextStatusAfterOwnerChange(
    vehicle.publicationStatus,
    actorRole,
  );
  if (publicationStatus) {
    await prismaClient.vehicle.update({
      where: { id: vehicleId },
      data: { publicationStatus },
    });
  }

  return {
    count: photos.count,
    vehicleId,
    publicationStatus: publicationStatus ?? vehicle.publicationStatus,
  };
}

export async function deleteVehiclePhoto(
  vehicleId: string,
  photoId: string,
  ownerId: string,
  actorRole?: string,
  prismaClient: PhotoPrismaClient = prisma,
) {
  const photo = await prismaClient.vehiclePhoto.findFirst({
    where: {
      id: photoId,
      vehicleId,
      vehicle: { ownerId },
    },
    include: {
      vehicle: { select: { publicationStatus: true } },
    },
  });

  if (!photo) {
    throw new Error("Photo introuvable ou non autorisée.");
  }

  await prismaClient.vehiclePhoto.delete({
    where: { id: photoId },
  });

  const absolutePath = path.resolve(photo.storageKey);
  await fs.unlink(absolutePath).catch(() => undefined);

  // Un véhicule publié modifié (suppression de photo) repasse en validation.
  const publicationStatus = nextStatusAfterOwnerChange(
    photo.vehicle.publicationStatus,
    actorRole,
  );
  if (publicationStatus) {
    await prismaClient.vehicle.update({
      where: { id: vehicleId },
      data: { publicationStatus },
    });
  }

  return {
    deleted: true,
    photoId,
    publicationStatus:
      publicationStatus ?? photo.vehicle.publicationStatus,
  };
}
