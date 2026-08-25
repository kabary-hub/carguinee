-- Migration: Rendre bookingId nullable dans la table Payment
-- Permet les paiements liés à des boosts (pas de réservation associée)

ALTER TABLE "Payment" DROP CONSTRAINT "Payment_bookingId_fkey";

ALTER TABLE "Payment" ALTER COLUMN "bookingId" DROP NOT NULL;

ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "RentalBooking"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
