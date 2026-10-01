-- Botão de WhatsApp no anúncio: o anunciante escolhe se mostra o telefone

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "showWhatsapp" BOOLEAN NOT NULL DEFAULT false;
