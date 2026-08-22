-- CreateEnum
CREATE TYPE "OwnerRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "OwnerRequest" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "status" "OwnerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "motivation" TEXT,
    "rejectionReason" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "OwnerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OwnerRequest_userId_status_idx" ON "OwnerRequest"("userId", "status");

-- CreateIndex
CREATE INDEX "OwnerRequest_status_createdAt_idx" ON "OwnerRequest"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "OwnerRequest" ADD CONSTRAINT "OwnerRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerRequest" ADD CONSTRAINT "OwnerRequest_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
