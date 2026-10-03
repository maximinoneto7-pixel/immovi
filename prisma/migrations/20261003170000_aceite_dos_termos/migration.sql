-- Registro de aceite dos Termos: versão, data e IP

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsVersion" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsAcceptedIp" TEXT;
