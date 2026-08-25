/**
 * Fix : applique la migration bookingId nullable directement via raw SQL.
 * Usage : cd backend && npx tsx scripts/fix-bookingid.ts
 */

import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const a = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const p = new PrismaClient({ adapter: a });

async function run() {
  console.log("🔧 Fix bookingId nullable dans Payment...\n");

  try {
    await p.$executeRawUnsafe('ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey"');
    console.log("1/3 ✅ Contrainte FK supprimée");
  } catch (e: any) {
    console.log("1/3 ⚠️ " + e.message.substring(0, 100));
  }

  try {
    await p.$executeRawUnsafe('ALTER TABLE "Payment" ALTER COLUMN "bookingId" DROP NOT NULL');
    console.log("2/3 ✅ bookingId rendu nullable");
  } catch (e: any) {
    console.log("2/3 ⚠️ " + e.message.substring(0, 100));
  }

  try {
    await p.$executeRawUnsafe(
      'ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "RentalBooking"("id") ON DELETE SET NULL ON UPDATE CASCADE'
    );
    console.log("3/3 ✅ Nouvelle contrainte FK ajoutée");
  } catch (e: any) {
    console.log("3/3 ⚠️ " + e.message.substring(0, 100));
  }

  // Vérification
  const r: any[] = await p.$queryRawUnsafe(
    `SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'bookingId'`
  );
  console.log(`\n📊 Vérification : bookingId is_nullable = ${r[0]?.is_nullable}`);

  if (r[0]?.is_nullable === "YES") {
    console.log("✅ Migration correctement appliquée !");
  } else {
    console.log("❌ Le champ est encore NOT NULL — vérifiez manuellement avec psql");
  }

  await p.$disconnect();
}

run().catch(console.error);
