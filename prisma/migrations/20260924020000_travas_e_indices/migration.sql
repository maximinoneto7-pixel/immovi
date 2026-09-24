-- Trava de tentativas de login e índices das buscas
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedLogins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);
-- CreateIndex
CREATE INDEX "Property_status_city_idx" ON "Property"("status", "city");
-- CreateIndex
CREATE INDEX "Property_status_state_idx" ON "Property"("status", "state");
-- CreateIndex
CREATE INDEX "Property_status_type_idx" ON "Property"("status", "type");
-- CreateIndex
CREATE INDEX "Property_status_createdAt_idx" ON "Property"("status", "createdAt");
-- CreateIndex
CREATE INDEX "Property_ownerId_idx" ON "Property"("ownerId");
