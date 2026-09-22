-- Aviso de baixa de preço nos favoritos
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "priceAlerts" BOOLEAN NOT NULL DEFAULT true;
-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "priceAlertAt" TIMESTAMP(3);
