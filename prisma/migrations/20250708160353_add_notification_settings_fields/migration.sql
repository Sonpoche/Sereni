/*
  Warnings:

  - You are about to drop the column `bookingConfirmations` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `bookingReminders` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `marketingEmails` on the `NotificationSettings` table. All the data in the column will be lost.
  - You are about to drop the column `reviewReminders` on the `NotificationSettings` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "NotificationSettings" DROP COLUMN "bookingConfirmations",
DROP COLUMN "bookingReminders",
DROP COLUMN "marketingEmails",
DROP COLUMN "reviewReminders",
ADD COLUMN     "autoConfirmCancelations" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "cancelationNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "defaultCancelationReason" TEXT DEFAULT 'Raisons personnelles',
ADD COLUMN     "emailSignature" TEXT,
ADD COLUMN     "newBookingNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "reminderNotifications" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
