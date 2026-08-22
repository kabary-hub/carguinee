import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import {
  DEMO_OWNER_PHONE,
  demoVehicleGalleries,
  hasEightDemoPhotos,
} from "../src/modules/vehicles/demo-gallery.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL est obligatoire pour synchroniser les galeries.");
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function main() {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      OR: demoVehicleGalleries.map(({ brand, model }) => ({ brand, model })),
    },
    include: {
      owner: { select: { phone: true } },
      photos: { orderBy: { sortOrder: "asc" } },
    },
  });

  let synchronized = 0;

  for (const vehicle of vehicles) {
    const gallery = demoVehicleGalleries.find(
      (item) => item.brand === vehicle.brand && item.model === vehicle.model,
    );

    if (!gallery) continue;

    const isDemoVehicle =
      vehicle.owner.phone === DEMO_OWNER_PHONE ||
      vehicle.description?.includes("[DEMO]") ||
      vehicle.description?.toLowerCase().includes("avec chauffeur");

    if (!isDemoVehicle) continue;

    const currentUrls = vehicle.photos.map((photo) => photo.url);
    const hasExpectedGallery =
      hasEightDemoPhotos(currentUrls) &&
      currentUrls.every((url, index) => url === gallery.photos[index]);

    if (hasExpectedGallery) continue;

    await prisma.$transaction([
      prisma.vehiclePhoto.deleteMany({ where: { vehicleId: vehicle.id } }),
      prisma.vehiclePhoto.createMany({
        data: gallery.photos.map((url, sortOrder) => ({
          vehicleId: vehicle.id,
          url,
          storageKey: url,
          sortOrder,
          sizeBytes: 0,
        })),
      }),
    ]);

    synchronized += 1;
    console.log(`Galerie de 8 photos synchronisée : ${vehicle.brand} ${vehicle.model}`);
  }

  if (synchronized === 0) {
    console.log("Aucun véhicule de démonstration à mettre à jour. Les galeries sont peut-être déjà synchronisées.");
  } else {
    console.log(`${synchronized} galerie(s) synchronisée(s) sans supprimer de véhicule ni de réservation.`);
  }
}

main().finally(() => prisma.$disconnect());
