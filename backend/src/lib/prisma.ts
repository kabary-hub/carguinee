/**
 * Client Prisma singleton pour CarGuinée.
 *
 * - En dev : le .env est chargé par `import "dotenv/config"`
 * - En CI : DATABASE_URL est défini par GitHub Actions (pas de .env)
 * - En prod : DATABASE_URL est défini par Docker/env
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL est obligatoire pour initialiser Prisma.");
}

const adapter = new PrismaPg({ connectionString });

export const prisma = new PrismaClient({ adapter });
