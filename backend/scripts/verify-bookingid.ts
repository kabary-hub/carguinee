import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

async function main() {
  console.log("DB:", process.env.DATABASE_URL?.substring(0, 60));
  const a = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const p = new PrismaClient({ adapter: a });

  const r: any[] = await p.$queryRawUnsafe(
    "SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'Payment' AND column_name = 'bookingId'"
  );
  console.log("bookingId is_nullable:", r[0]?.is_nullable);

  // Test: try to create a payment with null bookingId
  try {
    const pay = await p.payment.create({
      data: {
        bookingId: null,
        userId: "00000000-0000-0000-0000-000000000000",
        amount: 1,
        provider: "TEST",
        phone: "000",
        status: "PENDING",
      },
    });
    console.log("CREATE_OK:", pay.id);
    await p.payment.delete({ where: { id: pay.id } });
    console.log("DELETE_OK");
  } catch (e: any) {
    console.log("CREATE_FAILED:", e.message.substring(0, 200));
  }

  await p.$disconnect();
}

main();
