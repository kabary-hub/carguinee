-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLIENT', 'PROPRIETAIRE', 'ADMIN');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('CITADINE', 'BERLINE', 'SUV', 'QUATRE_QUATRE', 'UTILITAIRE', 'MINIBUS', 'CAMION', 'MOTO', 'AUTRE');

-- CreateEnum
CREATE TYPE "VehicleCondition" AS ENUM ('NEUF', 'OCCASION');

-- CreateEnum
CREATE TYPE "Commune" AS ENUM ('KALOUM', 'DIXINN', 'MATAM', 'RATOMA', 'MATOTO');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('BROUILLON', 'EN_ATTENTE_VALIDATION', 'PUBLIEE', 'REJETEE', 'ARCHIVEE');

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('DISPONIBLE', 'EN_NEGOCIATION', 'VENDUE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('EN_ATTENTE', 'CONFIRMEE', 'EN_COURS', 'TERMINEE', 'ANNULEE', 'REJETEE');

-- CreateEnum
CREATE TYPE "DepositStatus" AS ENUM ('NON_REQUIS', 'A_PAYER', 'DETENU', 'RESTITUE', 'RETENU_PARTIELLEMENT', 'RETENU_TOTAL');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPhoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" UUID NOT NULL,
    "ownerId" UUID NOT NULL,
    "type" "VehicleType" NOT NULL,
    "condition" "VehicleCondition" NOT NULL DEFAULT 'OCCASION',
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER,
    "mileageKm" INTEGER,
    "color" TEXT,
    "seats" INTEGER,
    "description" TEXT,
    "supportsRental" BOOLEAN NOT NULL DEFAULT false,
    "supportsSale" BOOLEAN NOT NULL DEFAULT false,
    "dailyRentalPriceGnf" INTEGER,
    "rentalDepositGnf" INTEGER,
    "salePriceGnf" INTEGER,
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'BROUILLON',
    "commune" "Commune" NOT NULL,
    "quartier" TEXT NOT NULL,
    "secteur" TEXT NOT NULL,
    "addressDetails" TEXT,
    "latitude" DECIMAL(9,6),
    "longitude" DECIMAL(9,6),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehiclePhoto" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "sizeBytes" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehiclePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RentalBooking" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "startDate" TIMESTAMPTZ(3) NOT NULL,
    "endDate" TIMESTAMPTZ(3) NOT NULL,
    "dailyRateGnf" INTEGER NOT NULL,
    "totalAmountGnf" INTEGER NOT NULL,
    "depositAmountGnf" INTEGER NOT NULL DEFAULT 0,
    "depositStatus" "DepositStatus" NOT NULL DEFAULT 'NON_REQUIS',
    "status" "BookingStatus" NOT NULL DEFAULT 'EN_ATTENTE',
    "notes" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "RentalBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleListing" (
    "id" UUID NOT NULL,
    "vehicleId" UUID NOT NULL,
    "sellerId" UUID NOT NULL,
    "askingPriceGnf" INTEGER NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'DISPONIBLE',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'BROUILLON',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SaleListing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_isActive_idx" ON "User"("isActive");

-- CreateIndex
CREATE INDEX "Vehicle_ownerId_idx" ON "Vehicle"("ownerId");

-- CreateIndex
CREATE INDEX "Vehicle_type_commune_idx" ON "Vehicle"("type", "commune");

-- CreateIndex
CREATE INDEX "Vehicle_publicationStatus_idx" ON "Vehicle"("publicationStatus");

-- CreateIndex
CREATE INDEX "Vehicle_supportsRental_dailyRentalPriceGnf_idx" ON "Vehicle"("supportsRental", "dailyRentalPriceGnf");

-- CreateIndex
CREATE INDEX "Vehicle_supportsSale_salePriceGnf_idx" ON "Vehicle"("supportsSale", "salePriceGnf");

-- CreateIndex
CREATE INDEX "VehiclePhoto_vehicleId_sortOrder_idx" ON "VehiclePhoto"("vehicleId", "sortOrder");

-- CreateIndex
CREATE INDEX "RentalBooking_vehicleId_startDate_endDate_idx" ON "RentalBooking"("vehicleId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "RentalBooking_customerId_status_idx" ON "RentalBooking"("customerId", "status");

-- CreateIndex
CREATE INDEX "RentalBooking_status_idx" ON "RentalBooking"("status");

-- CreateIndex
CREATE UNIQUE INDEX "SaleListing_vehicleId_key" ON "SaleListing"("vehicleId");

-- CreateIndex
CREATE INDEX "SaleListing_sellerId_idx" ON "SaleListing"("sellerId");

-- CreateIndex
CREATE INDEX "SaleListing_status_publicationStatus_idx" ON "SaleListing"("status", "publicationStatus");

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehiclePhoto" ADD CONSTRAINT "VehiclePhoto_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBooking" ADD CONSTRAINT "RentalBooking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalBooking" ADD CONSTRAINT "RentalBooking_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleListing" ADD CONSTRAINT "SaleListing_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleListing" ADD CONSTRAINT "SaleListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
