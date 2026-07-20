-- AlterTable
ALTER TABLE "QrCode" ADD COLUMN     "rawUrl" TEXT,
ADD COLUMN     "style" TEXT NOT NULL DEFAULT 'squares',
ALTER COLUMN "linkId" DROP NOT NULL;
