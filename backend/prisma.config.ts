import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import path from "path";

// S'assurer que le .env est chargé pour les commandes CLI Prisma
config({ path: path.resolve(__dirname, ".env") });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/carguinee",
  },
});

