import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL") || "postgresql://localhost:5432/carguinee",
    shadowDatabaseUrl: env("SHADOW_DATABASE_URL"),
  },
});

