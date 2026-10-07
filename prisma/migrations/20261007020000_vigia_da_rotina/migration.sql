-- Registro de cada execução da rotina diária, para saber se ela parou de rodar

-- CreateTable
CREATE TABLE "SystemRun" (
    "id" TEXT NOT NULL,
    "task" TEXT NOT NULL DEFAULT 'manutencao',
    "ok" BOOLEAN NOT NULL DEFAULT true,
    "detail" TEXT,
    "ms" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemRun_task_createdAt_idx" ON "SystemRun"("task", "createdAt");
