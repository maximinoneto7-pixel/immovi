-- Erros passam a ficar guardados. Antes o aviso só virava e-mail e o controle de
-- repetição vivia na memória do servidor: na Vercel, cada instância tem a sua,
-- então a repetição sumia e o motivo real do problema se perdia junto.

-- CreateTable
CREATE TABLE "ErroRegistrado" (
    "id" TEXT NOT NULL,
    "chave" TEXT NOT NULL,
    "onde" TEXT NOT NULL,
    "mensagem" TEXT NOT NULL,
    "pilha" TEXT,
    "detalhes" TEXT,
    "vezes" INTEGER NOT NULL DEFAULT 1,
    "avisadoEm" TIMESTAMP(3),
    "resolvidoEm" TIMESTAMP(3),
    "primeiraEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ultimaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErroRegistrado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ErroRegistrado_chave_key" ON "ErroRegistrado"("chave");

-- CreateIndex
CREATE INDEX "ErroRegistrado_resolvidoEm_ultimaEm_idx" ON "ErroRegistrado"("resolvidoEm", "ultimaEm");
