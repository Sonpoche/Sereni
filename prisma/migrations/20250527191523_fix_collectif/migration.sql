/*
  Warnings:

  - You are about to drop the column `maxParticipants` on the `Service` table. All the data in the column will be lost.
  - You are about to drop the `CourseProgram` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `CourseSession` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SessionRegistration` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "CourseProgram" DROP CONSTRAINT "CourseProgram_professionalId_fkey";

-- DropForeignKey
ALTER TABLE "CourseSession" DROP CONSTRAINT "CourseSession_programId_fkey";

-- DropForeignKey
ALTER TABLE "SessionRegistration" DROP CONSTRAINT "SessionRegistration_clientId_fkey";

-- DropForeignKey
ALTER TABLE "SessionRegistration" DROP CONSTRAINT "SessionRegistration_sessionId_fkey";

-- AlterTable
ALTER TABLE "Service" DROP COLUMN "maxParticipants";

-- DropTable
DROP TABLE "CourseProgram";

-- DropTable
DROP TABLE "CourseSession";

-- DropTable
DROP TABLE "SessionRegistration";

-- CreateTable
CREATE TABLE "GroupClass" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "duration" INTEGER NOT NULL,
    "maxParticipants" INTEGER NOT NULL,
    "professionalId" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "address" TEXT,
    "city" TEXT,
    "postalCode" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isOnline" BOOLEAN NOT NULL DEFAULT false,
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "level" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupSession" (
    "id" TEXT NOT NULL,
    "groupClassId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "currentParticipants" INTEGER NOT NULL DEFAULT 0,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrenceRule" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupRegistration" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "registeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GroupRegistration_sessionId_clientId_key" ON "GroupRegistration"("sessionId", "clientId");

-- AddForeignKey
ALTER TABLE "GroupClass" ADD CONSTRAINT "GroupClass_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupSession" ADD CONSTRAINT "GroupSession_groupClassId_fkey" FOREIGN KEY ("groupClassId") REFERENCES "GroupClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRegistration" ADD CONSTRAINT "GroupRegistration_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "GroupSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupRegistration" ADD CONSTRAINT "GroupRegistration_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
