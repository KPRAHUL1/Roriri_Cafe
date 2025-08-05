-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pin" TEXT,
ADD COLUMN     "pinAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "pinLockedUntil" TIMESTAMP(3);
