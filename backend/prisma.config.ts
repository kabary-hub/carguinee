import { defineConfig } from "prisma/config";
import { config } from "dotenv";
import path from "path";
import fs from "fs";

// Charger le .env seulement s'il existe (évite les erreurs en CI)
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://localhost:5432/carguinee",
  },
});
