-- Recado de quem não tem conta: o interessado deixa nome e telefone no anúncio
-- e o anunciante recebe na hora, sem exigir cadastro antes da primeira pergunta.

-- CreateTable
CREATE TABLE "Recado" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "message" TEXT,
    "ip" TEXT,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recado_propertyId_createdAt_idx" ON "Recado"("propertyId", "createdAt");

-- CreateIndex
CREATE INDEX "Recado_ip_createdAt_idx" ON "Recado"("ip", "createdAt");

-- AddForeignKey
ALTER TABLE "Recado" ADD CONSTRAINT "Recado_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
