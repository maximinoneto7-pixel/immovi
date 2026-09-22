-- Chat: "visto por último", opção de privacidade e "visualizada às"
-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "readAt" TIMESTAMP(3);
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "lastSeenAt" TIMESTAMP(3),
ADD COLUMN     "showActivity" BOOLEAN NOT NULL DEFAULT true;
