-- Oferta de abertura: 60 dias de Destaque para os 50 primeiros

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "planWarnedAt" TIMESTAMP(3);
