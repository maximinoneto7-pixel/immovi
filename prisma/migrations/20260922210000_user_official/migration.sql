-- Conta oficial da Immovi (selo "Oficial Immovi" nos anúncios), ligada só pelo admin
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "official" BOOLEAN NOT NULL DEFAULT false;
