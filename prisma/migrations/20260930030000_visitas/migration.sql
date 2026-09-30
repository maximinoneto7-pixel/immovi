-- Visita agendada: o anunciante marca quando pode receber, o visitante escolhe o dia

-- CreateTable
CREATE TABLE "VisitAvailability" (
    "id" TEXT NOT NULL,
    "weekdays" TEXT NOT NULL DEFAULT '1,2,3,4,5',
    "periods" TEXT NOT NULL DEFAULT 'MANHA,TARDE',
    "minDays" INTEGER NOT NULL DEFAULT 1,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "propertyId" TEXT NOT NULL,

    CONSTRAINT "VisitAvailability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VisitAvailability_propertyId_key" ON "VisitAvailability"("propertyId");

-- AddForeignKey
ALTER TABLE "VisitAvailability" ADD CONSTRAINT "VisitAvailability_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Visit" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "period" TEXT NOT NULL,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "answerNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "canceledById" TEXT,
    "remindedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "propertyId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "conversationId" TEXT,

    CONSTRAINT "Visit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Visit_propertyId_date_idx" ON "Visit"("propertyId", "date");

-- CreateIndex
CREATE INDEX "Visit_status_date_idx" ON "Visit"("status", "date");

-- CreateIndex
CREATE INDEX "Visit_visitorId_date_idx" ON "Visit"("visitorId", "date");

-- CreateIndex
CREATE INDEX "Visit_ownerId_date_idx" ON "Visit"("ownerId", "date");

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_visitorId_fkey" FOREIGN KEY ("visitorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Visit" ADD CONSTRAINT "Visit_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
