/*
  Warnings:

  - The `emailVerified` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'pro';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "image" TEXT,
DROP COLUMN "emailVerified",
ADD COLUMN     "emailVerified" TIMESTAMP(3),
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "AuditLog_userId_entityType_action_createdAt_idx" ON "AuditLog"("userId", "entityType", "action", "createdAt");
