import { z } from "zod";

export const createBookingSchema = z
  .object({
    vehicleId: z.string().uuid(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    notes: z.string().trim().max(1000).optional(),
  })
  .refine((input) => input.startDate > new Date(), {
    path: ["startDate"],
    message: "La date de début doit être dans le futur.",
  })
  .refine((input) => input.endDate > input.startDate, {
    path: ["endDate"],
    message: "La date de fin doit être postérieure à la date de début.",
  });

export const bookingStatusSchema = z.object({
  status: z.enum(["CONFIRMEE", "REJETEE", "ANNULEE", "EN_COURS", "TERMINEE"]),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;
