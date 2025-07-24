-- CreateEnum
CREATE TYPE "OppositePartyResponse" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'OPPOSITE_PARTY_CONTACTED';

-- AlterTable
ALTER TABLE "cases" ADD COLUMN     "mediationEndDate" TIMESTAMP(3),
ADD COLUMN     "mediationStartDate" TIMESTAMP(3),
ADD COLUMN     "oppositePartyResponse" "OppositePartyResponse" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "resolutionDetails" TEXT;
