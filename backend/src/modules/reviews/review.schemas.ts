import { z } from "zod";

// ── Schéma de création d'un avis ──────────────────────────────────────────────
export const createReviewSchema = z.object({
  bookingId: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  categories: z
    .object({
      communication: z.coerce.number().int().min(1).max(5).optional(),
      ponctualite: z.coerce.number().int().min(1).max(5).optional(),
      proprete: z.coerce.number().int().min(1).max(5).optional(),
      etatVehicule: z.coerce.number().int().min(1).max(5).optional(),
    })
    .optional(),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
