-- Prioridade na busca por plano, e Foguetes inclusos na assinatura

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "planRank" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Property_status_featured_planRank_createdAt_idx" ON "Property"("status", "featured", "planRank", "createdAt");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "creditoFoguetes" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "creditoRenovadoEm" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "planCortesia" BOOLEAN NOT NULL DEFAULT false;
