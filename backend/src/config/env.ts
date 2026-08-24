import "dotenv/config";
import { z } from "zod";
import crypto from "crypto";

// Valeur par défaut interdite pour ENCRYPTION_KEY
const FORBIDDEN_KEY = "0000000000000000000000000000000000000000000000000000000000000000";

function validateEncryptionKey(val: string): string {
  if (val === FORBIDDEN_KEY) {
    throw new Error(
      "ENCRYPTION_KEY ne peut pas être la valeur par défaut. " +
      "Générez une clé avec : node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return val;
}

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(32),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default("http://localhost:5173" ),
  LIBRETRANSLATE_URL: z.string().url().default("http://localhost:5000"),
  LIBRETRANSLATE_API_KEY: z.string().default(""),
  TRANSLATION_ENABLED: z.coerce.boolean().default(true),
  RESEND_API_KEY: z.string().optional(),
  ENCRYPTION_KEY: z
    .string()
    .regex(/^[0-9a-f]{64}$/i, "ENCRYPTION_KEY doit faire 64 caractères hexadécimaux (32 octets)")
    .refine(validateEncryptionKey, "ENCRYPTION_KEY ne peut pas être la valeur par défaut"),
  COOKIE_SECRET: z.string().min(32).optional(),
  // ── Orange Money API (Feature 1: Paiements) ──────────────────────────
  OM_APP_KEY: z.string().optional(),
  OM_APP_SECRET: z.string().optional(),
  OM_MERCHANT_KEY: z.string().optional(),
  OM_SANDBOX: z.coerce.boolean().default(true),
  // ── Mapbox (Feature 3: Géolocalisation) ──────────────────────────────
  MAPBOX_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("\n❌ Erreur de configuration :\n");
  for (const issue of parsed.error.issues) {
    console.error(`  • ${issue.path.join(".")}: ${issue.message}`);
  }
  console.error("\nConsultez .env.example pour la configuration.\n");
  process.exit(1);
}

export const env = {
  ...parsed.data,
  // Générer un COOKIE_SECRET aléatoire si non fourni
  COOKIE_SECRET: parsed.data.COOKIE_SECRET || crypto.randomBytes(32).toString("hex"),
  OM_APP_KEY: parsed.data.OM_APP_KEY ?? "",
  OM_APP_SECRET: parsed.data.OM_APP_SECRET ?? "",
  OM_MERCHANT_KEY: parsed.data.OM_MERCHANT_KEY ?? "",
  OM_SANDBOX: parsed.data.OM_SANDBOX ?? true,
  MAPBOX_TOKEN: parsed.data.MAPBOX_TOKEN ?? "",
};
