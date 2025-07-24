-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'LAWYER', 'RELIGIOUS_SCHOLAR', 'SOCIAL_EXPERT');

-- CreateEnum
CREATE TYPE "CaseType" AS ENUM ('FAMILY', 'BUSINESS', 'CRIMINAL', 'PROPERTY', 'OTHER');

-- CreateEnum
CREATE TYPE "CaseStatus" AS ENUM ('PENDING', 'AWAITING_RESPONSE', 'ACCEPTED', 'PANEL_CREATED', 'MEDIATION_IN_PROGRESS', 'RESOLVED', 'UNRESOLVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'PDF', 'OTHER');

-- CreateEnum
CREATE TYPE "PanelRole" AS ENUM ('LAWYER', 'RELIGIOUS_SCHOLAR', 'SOCIAL_EXPERT');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('CASE_UPDATE', 'PANEL_INVITATION', 'MEDIATION_SCHEDULED', 'CASE_RESOLVED', 'SYSTEM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" "Gender" NOT NULL,
    "photo" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cases" (
    "id" TEXT NOT NULL,
    "caseType" "CaseType" NOT NULL,
    "issueDescription" TEXT NOT NULL,
    "isCourtPending" BOOLEAN NOT NULL DEFAULT false,
    "caseNumber" TEXT,
    "firNumber" TEXT,
    "courtPoliceStation" TEXT,
    "status" "CaseStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "plaintiffId" TEXT NOT NULL,
    "defendantId" TEXT,

    CONSTRAINT "cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "opposite_parties" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "caseId" TEXT NOT NULL,

    CONSTRAINT "opposite_parties_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "filepath" TEXT NOT NULL,
    "fileType" "DocumentType" NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "caseId" TEXT NOT NULL,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panels" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "panel_members" (
    "id" TEXT NOT NULL,
    "panelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PanelRole" NOT NULL,

    CONSTRAINT "panel_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_updates" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "status" "CaseStatus" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "case_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "caseId" TEXT,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "addresses_userId_key" ON "addresses"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "opposite_parties_caseId_key" ON "opposite_parties"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "panels_caseId_key" ON "panels"("caseId");

-- CreateIndex
CREATE UNIQUE INDEX "panel_members_panelId_userId_key" ON "panel_members"("panelId", "userId");

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_plaintiffId_fkey" FOREIGN KEY ("plaintiffId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cases" ADD CONSTRAINT "cases_defendantId_fkey" FOREIGN KEY ("defendantId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opposite_parties" ADD CONSTRAINT "opposite_parties_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panels" ADD CONSTRAINT "panels_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panel_members" ADD CONSTRAINT "panel_members_panelId_fkey" FOREIGN KEY ("panelId") REFERENCES "panels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "panel_members" ADD CONSTRAINT "panel_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_updates" ADD CONSTRAINT "case_updates_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "cases"("id") ON DELETE CASCADE ON UPDATE CASCADE;
