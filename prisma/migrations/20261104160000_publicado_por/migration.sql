-- Anúncio cadastrado por outra pessoa (administrador publicando em nome do dono).
-- O dono continua sendo o dono: é ele que recebe os contatos e é só ele que edita.
-- Fica registrado quem cadastrou, para a regra de moderação continuar de pé.

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "publicadoPorId" TEXT;

-- AddForeignKey
ALTER TABLE "Property" ADD CONSTRAINT "Property_publicadoPorId_fkey" FOREIGN KEY ("publicadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
