import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173" ),
  LIBRETRANSLATE_URL: z.string().url().default("http://localhost:5000"),
  LIBRETRANSLATE_API_KEY: z.string().default(""),
  TRANSLATION_ENABLED: z.coerce.boolean().default(true),
  RESEND_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
