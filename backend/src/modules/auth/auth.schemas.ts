import { z } from "zod";

export const registerSchema = z.object({
  phone: z.string().trim().min(8).max(20),
  email: z.string().trim().email().optional(),
  password: z
    .string()
    .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
    .regex(/[A-Za-z]/, "Le mot de passe doit contenir une lettre.")
    .regex(/[0-9]/, "Le mot de passe doit contenir un chiffre."),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

export const loginSchema = z.object({
  phone: z.string().trim().min(8).max(20),
  password: z.string().min(8),
});

export const ownerRequestSchema = z.object({
  motivation: z.string().trim().max(1000).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OwnerRequestInput = z.infer<typeof ownerRequestSchema>;
