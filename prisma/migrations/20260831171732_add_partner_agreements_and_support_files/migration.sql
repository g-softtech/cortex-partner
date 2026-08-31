-- AlterTable
ALTER TABLE "SupportRequest" ADD COLUMN     "projectId" TEXT;

-- CreateTable
CREATE TABLE "SupportRequestFile" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageReference" TEXT NOT NULL,
    "supportRequestId" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupportRequestFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnerAgreementLog" (
    "id" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,

    CONSTRAINT "PartnerAgreementLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SupportRequestFile_storageReference_key" ON "SupportRequestFile"("storageReference");

-- CreateIndex
CREATE INDEX "SupportRequestFile_supportRequestId_idx" ON "SupportRequestFile"("supportRequestId");

-- CreateIndex
CREATE INDEX "PartnerAgreementLog_partnerId_idx" ON "PartnerAgreementLog"("partnerId");

-- CreateIndex
CREATE INDEX "SupportRequest_projectId_idx" ON "SupportRequest"("projectId");

-- AddForeignKey
ALTER TABLE "SupportRequestFile" ADD CONSTRAINT "SupportRequestFile_supportRequestId_fkey" FOREIGN KEY ("supportRequestId") REFERENCES "SupportRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequestFile" ADD CONSTRAINT "SupportRequestFile_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportRequest" ADD CONSTRAINT "SupportRequest_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnerAgreementLog" ADD CONSTRAINT "PartnerAgreementLog_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
