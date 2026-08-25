import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  const a = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const p = new PrismaClient({ adapter: a });

  // 1. Vérifier le schéma
  const r: any[] = await p.$queryRawUnsafe(
    "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'bookingId'"
  );
  console.log("1. bookingId is_nullable:", r[0]?.is_nullable);

  // 2. Trouver un vrai user
  const user = await p.user.findFirst({ select: { id: true, phone: true } });
  if (!user) {
    console.log("2. Aucun user en base");
    await p.$disconnect();
    return;
  }
  console.log("2. User trouvé:", user.phone);

  // 3. Créer un payment avec bookingId: null
  try {
    const pay = await p.payment.create({
      data: {
        bookingId: null,
        userId: user.id,
        amount: 50000,
        provider: "ORANGE_MONEY",
        phone: user.phone,
        status: "PAID",
        paidAt: new Date(),
        providerTxId: "SIM-BOOST-TEST-FINAL",
        metadata: { type: "BOOST", level: "PREMIUM", simulated: true },
      },
    });
    console.log("3. PAYMENT CREATED:", pay.id, "bookingId:", pay.bookingId);
    await p.payment.delete({ where: { id: pay.id } });
    console.log("4. CLEANUP OK");
  } catch (e: any) {
    console.log("3. FAIL:", e.message.substring(0, 300));
  }

  await p.$disconnect();
  console.log("\nDONE");
}

main();
