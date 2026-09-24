-- Conferência da matrícula pela equipe e encerramento de conta pelo titular
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "archivedName" TEXT,
ADD COLUMN     "archivedCpf" TEXT;
-- AlterTable
ALTER TABLE "PropertyDocument" ADD COLUMN     "fileUrl" TEXT,
ADD COLUMN     "reviewedById" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewNote" TEXT;
