-- Résout une dérive de schéma (schema drift).
--
-- `User.isBanned` existait dans schema.prisma et dans le client Prisma généré,
-- mais AUCUNE migration ne créait la colonne : elle avait été poussée sur les
-- bases de dev via `prisma db push`. En CI, seul `prisma migrate deploy` est
-- exécuté (migrations validées uniquement), donc la colonne était absente et
-- tous les tests touchant le modèle User échouaient
-- ("The column `User.isBanned` does not exist in the current database").
--
-- `IF NOT EXISTS` rend la migration sûre sur les bases dev/prod qui possèdent
-- déjà la colonne, tout en l'ajoutant proprement sur la base fraîche du CI.

-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBanned" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable : la colonne id est générée côté application via @default(uuid()),
-- on supprime le DEFAULT gen_random_uuid() résiduel pour coller au schéma.
ALTER TABLE "ReactivationRequest" ALTER COLUMN "id" DROP DEFAULT;
