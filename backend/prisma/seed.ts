import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL est obligatoire pour charger les données de démonstration.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
const passwordHash = await bcrypt.hash("12345678", 12);
const gallery = (folder: string, extensions: string[] = ["jpg", "jpg", "jpg", "jpg", "jpg", "jpg", "jpg", "jpg"]) => extensions.map((extension, index) => `/demo-vehicles/${folder}/${String(index + 1).padStart(2, "0")}.${extension}`);

const demoVehicles = [
  { brand: "Renault", model: "Clio", type: "CITADINE", year: 2021, mileageKm: 42000, color: "Rouge", seats: 5, commune: "DIXINN", quartier: "Bellevue", secteur: "Rond-point", dailyRentalPriceGnf: 420000, rentalDepositGnf: 800000, salePriceGnf: 84000000, gallery: gallery("renault-clio", ["jpg", "jpg", "jpg", "jpg", "jpg", "webp", "jpg", "jpg"]), descriptionFr: "Renault Clio 2021, citadine 5 places à hayon conçue pour les déplacements urbains. Son format compact facilite les trajets à Conakry, tandis que l'habitacle accueille confortablement un conducteur et ses passagers.", descriptionEn: "Renault Clio 2021, 5-seat hatchback designed for urban travel. Its compact size makes Conakry commutes easy, while the cabin comfortably accommodates a driver and passengers.", supportsSale: true },
  { brand: "Toyota", model: "RAV4", type: "SUV", year: 2022, mileageKm: 28000, color: "Noir", seats: 5, commune: "RATOMA", quartier: "Nongo", secteur: "T7", dailyRentalPriceGnf: 850000, rentalDepositGnf: 1500000, salePriceGnf: 198000000, gallery: gallery("toyota-rav4", ["jpg", "jpg", "jpg", "jpeg", "jpg", "jpg", "png", "jpg"]), descriptionFr: "Toyota RAV4 2022, SUV 5 places reconnu pour sa position de conduite surélevée, son habitacle modulable et son coffre pratique. Il convient aux rendez-vous professionnels, aux transferts familiaux et aux déplacements sur route.", descriptionEn: "Toyota RAV4 2022, 5-seat SUV known for its elevated driving position, modular cabin, and practical trunk. Suitable for business meetings, family transfers, and road travel.", supportsSale: true },
  { brand: "Toyota", model: "Hiace", type: "MINIBUS", year: 2020, mileageKm: 65000, color: "Blanc", seats: 14, commune: "MATOTO", quartier: "Kagbelen", secteur: "Gare routière", dailyRentalPriceGnf: 1200000, rentalDepositGnf: 2000000, salePriceGnf: null, gallery: gallery("toyota-hiace", ["png", "jpg", "jpg", "jpg", "jpg", "jpg", "png", "jpg"]), descriptionFr: "Toyota Hiace 2020, minibus 14 places aménagé pour les transferts de groupes, les événements et les excursions. Sa configuration passagers privilégie l'espace et l'accès à bord.", descriptionEn: "Toyota Hiace 2020, 14-seat minibus fitted for group transfers, events, and excursions. Its passenger layout prioritizes space and easy boarding.", supportsSale: false },
  { brand: "Nissan", model: "Navara", type: "UTILITAIRE", year: 2019, mileageKm: 78000, color: "Blanc", seats: 5, commune: "MATAM", quartier: "Madina", secteur: "Marché", dailyRentalPriceGnf: 950000, rentalDepositGnf: 1800000, salePriceGnf: 146000000, gallery: gallery("nissan-navara"), descriptionFr: "Nissan Navara 2019 double cabine, pick-up 5 places équipé d'une benne pour le transport de matériel. Il répond aux besoins logistiques, aux livraisons et aux déplacements professionnels nécessitant un véhicule robuste.", descriptionEn: "Nissan Navara 2019 double cab, 5-seat pickup with a bed for equipment transport. Handles logistics needs, deliveries, and professional travel requiring a sturdy vehicle.", supportsSale: true },
  { brand: "Toyota", model: "Land Cruiser", type: "QUATRE_QUATRE", year: 2021, mileageKm: 35000, color: "Noir", seats: 7, commune: "KALOUM", quartier: "Almamyah", secteur: "Centre-ville", dailyRentalPriceGnf: 1750000, rentalDepositGnf: 3500000, salePriceGnf: 325000000, gallery: gallery("toyota-land-cruiser"), descriptionFr: "Toyota Land Cruiser 2021, 4x4 7 places offrant une garde au sol élevée, trois rangées de sièges et un vaste habitacle. Ce véhicule convient aux déplacements officiels, aux cérémonies et aux longs trajets.", descriptionEn: "Toyota Land Cruiser 2021, 7-seat 4x4 offering high ground clearance, three rows of seats, and a spacious cabin. Suitable for official travel, ceremonies, and long journeys.", supportsSale: true },
  { brand: "Kia", model: "Sportage", type: "SUV", year: 2023, mileageKm: 18000, color: "Bleu", seats: 5, commune: "RATOMA", quartier: "Taouyah", secteur: "Carrefour", dailyRentalPriceGnf: 950000, rentalDepositGnf: 1700000, salePriceGnf: null, gallery: gallery("kia-sportage"), descriptionFr: "Kia Sportage 2023, SUV compact 5 places avec une présentation moderne, une banquette arrière accueillante et un coffre adapté aux bagages. Il est approprié aux déplacements d'affaires, aux sorties familiales et aux transferts.", descriptionEn: "Kia Sportage 2023, compact 5-seat SUV with a modern design, welcoming rear bench, and trunk suited for luggage. Ideal for business trips, family outings, and transfers.", supportsSale: false },
] as const;

async function main() {
  const admin = await prisma.user.upsert({
    where: { phone: "+224620980117" },
    update: { role: "ADMIN", passwordHash, firstName: "Admin", lastName: "Guinée", email: "admin@carguinee.local" },
    create: { phone: "+224620980117", email: "admin@carguinee.local", firstName: "Admin", lastName: "Guinée", role: "ADMIN", passwordHash, isPhoneVerified: true },
  });

  const owner = await prisma.user.upsert({
    where: { phone: "+224620980118" },
    update: { role: "PROPRIETAIRE", passwordHash, firstName: "Mamadou", lastName: "Camara", email: "proprietaire@carguinee.local" },
    create: { phone: "+224620980118", email: "proprietaire@carguinee.local", firstName: "Mamadou", lastName: "Camara", role: "PROPRIETAIRE", passwordHash, isPhoneVerified: true },
  });

  const client = await prisma.user.upsert({
    where: { phone: "+224620980119" },
    update: { role: "CLIENT", passwordHash, firstName: "Ibrahima", lastName: "Diallo", email: "client@carguinee.local" },
    create: { phone: "+224620980119", email: "client@carguinee.local", firstName: "Ibrahima", lastName: "Diallo", role: "CLIENT", passwordHash, isPhoneVerified: true },
  });

  // Nettoyer les anciens véhicules démo avant de recréer
  await prisma.vehicle.deleteMany({
    where: {
      ownerId: owner.id,
      OR: [
        { descriptionFr: { not: null } },
      ],
    },
  });

  for (const item of demoVehicles) {
    await prisma.vehicle.create({
      data: {
        ownerId: owner.id,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        publicationStatus: "PUBLIEE",
        condition: "OCCASION",
        type: item.type,
        brand: item.brand,
        model: item.model,
        year: item.year,
        mileageKm: item.mileageKm,
        color: item.color,
        seats: item.seats,
        commune: item.commune,
        quartier: item.quartier,
        secteur: item.secteur,
        descriptionFr: item.descriptionFr,
        descriptionEn: item.descriptionEn,
        supportsRental: true,
        supportsSale: item.supportsSale,
        dailyRentalPriceGnf: item.dailyRentalPriceGnf,
        rentalDepositGnf: item.rentalDepositGnf,
        salePriceGnf: item.salePriceGnf,
        photos: {
          create: item.gallery.map((url, sortOrder) => ({
            url,
            storageKey: url,
            sizeBytes: 0,
            sortOrder,
          })),
        },
        ...(item.supportsSale && item.salePriceGnf
          ? {
              saleListing: {
                create: {
                  sellerId: owner.id,
                  askingPriceGnf: item.salePriceGnf,
                  status: "DISPONIBLE",
                  publicationStatus: "PUBLIEE",
                },
              },
            }
          : {}),
      },
    });
  }

  console.log("6 publications avec 8 photos et chauffeur créées.");
  console.log("───────────────────────────────────────");
  console.log("Comptes de démonstration :");
  console.log("  Admin        : 620980117 / 12345678");
  console.log("  Propriétaire : 620980118 / 12345678");
  console.log("  Client       : 620980119 / 12345678");
}

main().finally(() => prisma.$disconnect());
