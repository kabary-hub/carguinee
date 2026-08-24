import { z } from "zod";

const vehicleTypes = [
  "CITADINE",
  "BERLINE",
  "SUV",
  "QUATRE_QUATRE",
  "UTILITAIRE",
  "MINIBUS",
  "CAMION",
  "MOTO",
  "AUTRE",
] as const;

const communes = ["KALOUM", "DIXINN", "MATAM", "RATOMA", "MATOTO"] as const;

const vehicleBaseSchema = z.object({
  type: z.enum(vehicleTypes),
  condition: z.enum(["NEUF", "OCCASION"]).default("OCCASION"),
  brand: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(80),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
  mileageKm: z.coerce.number().int().min(0).optional(),
  color: z.string().trim().max(50).optional(),
  seats: z.coerce.number().int().min(1).max(100).optional(),
  description: z.string().trim().max(5000).optional(),
  descriptionFr: z.string().trim().max(5000).optional(),
  descriptionEn: z.string().trim().max(5000).optional(),
  supportsRental: z.boolean().default(false),
  supportsSale: z.boolean().default(false),
  dailyRentalPriceGnf: z.coerce.number().int().positive().optional(),
  rentalDepositGnf: z.coerce.number().int().min(0).optional(),
  salePriceGnf: z.coerce.number().int().positive().optional(),
  commune: z.enum(communes),
  quartier: z.string().trim().min(1).max(120),
  secteur: z.string().trim().min(1).max(120),
  addressDetails: z.string().trim().max(255).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  // ── Documents administratifs ──
  carteGrisePresente: z.boolean().optional(),
  visiteTechniqueValideJusquA: z.coerce.string().optional(),
  assuranceValideJusquA: z.coerce.string().optional(),
});

export const createVehicleSchema = vehicleBaseSchema
  .refine((data) => data.supportsRental || data.supportsSale, {
    message: "Activez la location, la vente ou les deux.",
    path: ["supportsRental"],
  })
  .refine((data) => !data.supportsRental || data.dailyRentalPriceGnf !== undefined, {
    message: "Le tarif journalier est obligatoire pour la location.",
    path: ["dailyRentalPriceGnf"],
  })
  .refine((data) => !data.supportsSale || data.salePriceGnf !== undefined, {
    message: "Le prix de vente est obligatoire pour la vente.",
    path: ["salePriceGnf"],
  });

export const updateVehicleSchema = vehicleBaseSchema.partial();

const publicationStatuses = ["BROUILLON", "EN_ATTENTE_VALIDATION", "PUBLIEE", "REJETEE", "ARCHIVEE"] as const;

export const vehicleListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(100).optional(),
  commune: z.enum(communes).optional(),
  type: z.enum(vehicleTypes).optional(),
  supportsRental: z.enum(["true", "false"]).optional(),
  supportsSale: z.enum(["true", "false"]).optional(),
  minPriceGnf: z.coerce.number().int().min(0).optional(),
  maxPriceGnf: z.coerce.number().int().min(0).optional(),
});

/** Schéma admin : accepte le filtre publicationStatus */
export const vehicleAdminListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
  publicationStatus: z.enum(publicationStatuses).optional(),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type VehicleListQuery = z.infer<typeof vehicleListQuerySchema>;
