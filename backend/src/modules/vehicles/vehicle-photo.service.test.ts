import assert from "node:assert/strict";
import test from "node:test";
import type { PublicationStatus } from "../../generated/prisma/enums.js";
import {
  addVehiclePhotos,
  deleteVehiclePhoto,
  type PhotoPrismaClient,
} from "./vehicle-photo.service.js";

/** Construit un objet fichier minimal correspondant au type multer. */
function multerFile(name: string): Express.Multer.File {
  return {
    fieldname: "photos",
    originalname: name,
    encoding: "7bit",
    mimetype: "image/jpeg",
    size: 1024,
    destination: "/tmp",
    filename: name,
    path: `/tmp/${name}`,
    buffer: Buffer.alloc(0),
  } as unknown as Express.Multer.File;
}

type FakeVehicle = {
  id: string;
  ownerId: string;
  publicationStatus: PublicationStatus;
  photoCount: number;
};

/**
 * Construit un faux client Prisma conforme à PhotoPrismaClient et enregistre
 * les appels effectués pour vérifier le comportement du service.
 */
function fakePrisma(overrides: {
  vehicle?: FakeVehicle | null;
  photo?: { id: string; storageKey: string; publicationStatus: PublicationStatus } | null;
}) {
  const calls = {
    createMany: 0,
    delete: 0,
    updates: [] as unknown[],
  };

  const client = {
    vehicle: {
      findUnique: async () =>
        overrides.vehicle
          ? {
              id: overrides.vehicle.id,
              ownerId: overrides.vehicle.ownerId,
              publicationStatus: overrides.vehicle.publicationStatus,
              _count: { photos: overrides.vehicle.photoCount },
            }
          : null,
      update: async (args: unknown) => {
        calls.updates.push(args);
        return {};
      },
    },
    vehiclePhoto: {
      createMany: async () => {
        calls.createMany += 1;
        return { count: 1 };
      },
      findFirst: async () =>
        overrides.photo
          ? {
              id: overrides.photo.id,
              storageKey: overrides.photo.storageKey,
              vehicle: { publicationStatus: overrides.photo.publicationStatus },
            }
          : null,
      delete: async () => {
        calls.delete += 1;
        return {};
      },
    },
  } as unknown as PhotoPrismaClient;

  return { client, calls };
}

test("refuse la neuvième photo quand le véhicule en possède déjà sept", async () => {
  const { client, calls } = fakePrisma({
    vehicle: {
      id: "v1",
      ownerId: "owner",
      publicationStatus: "PUBLIEE",
      photoCount: 7,
    },
  });

  await assert.rejects(
    addVehiclePhotos("v1", "owner", [multerFile("a.jpg"), multerFile("b.jpg")], "PROPRIETAIRE", client),
    /plus de 8 photos/,
  );

  // Aucune écriture ne doit avoir eu lieu : ni photos, ni changement de statut.
  assert.equal(calls.createMany, 0);
  assert.equal(calls.updates.length, 0);
});

test("remet en validation un véhicule publié après l'ajout d'une photo", async () => {
  const { client, calls } = fakePrisma({
    vehicle: {
      id: "v1",
      ownerId: "owner",
      publicationStatus: "PUBLIEE",
      photoCount: 7,
    },
  });

  const result = await addVehiclePhotos(
    "v1",
    "owner",
    [multerFile("a.jpg")],
    "PROPRIETAIRE",
    client,
  );

  assert.equal(result.count, 1);
  assert.equal(result.publicationStatus, "EN_ATTENTE_VALIDATION");
  assert.equal(calls.createMany, 1);
  assert.equal(calls.updates.length, 1);
});

test("ne change pas le statut d'un brouillon après l'ajout d'une photo", async () => {
  const { client, calls } = fakePrisma({
    vehicle: {
      id: "v2",
      ownerId: "owner",
      publicationStatus: "BROUILLON",
      photoCount: 0,
    },
  });

  const result = await addVehiclePhotos(
    "v2",
    "owner",
    [multerFile("a.jpg")],
    "PROPRIETAIRE",
    client,
  );

  assert.equal(result.publicationStatus, "BROUILLON");
  assert.equal(calls.createMany, 1);
  assert.equal(calls.updates.length, 0);
});

test("remet en validation un véhicule publié après la suppression d'une photo", async () => {
  const { client, calls } = fakePrisma({
    photo: {
      id: "p1",
      storageKey: "uploads/vehicles/photo-absente.jpg",
      publicationStatus: "PUBLIEE",
    },
  });

  const result = await deleteVehiclePhoto(
    "v1",
    "p1",
    "owner",
    "PROPRIETAIRE",
    client,
  );

  assert.equal(result.deleted, true);
  assert.equal(result.publicationStatus, "EN_ATTENTE_VALIDATION");
  assert.equal(calls.delete, 1);
  assert.equal(calls.updates.length, 1);
});

test("refuse de supprimer la photo d'un véhicule qui n'appartient pas au propriétaire", async () => {
  const { client, calls } = fakePrisma({ photo: null });

  await assert.rejects(
    deleteVehiclePhoto("v1", "p1", "autre-owner", "PROPRIETAIRE", client),
    /Photo introuvable ou non autorisée/,
  );

  assert.equal(calls.delete, 0);
  assert.equal(calls.updates.length, 0);
});
