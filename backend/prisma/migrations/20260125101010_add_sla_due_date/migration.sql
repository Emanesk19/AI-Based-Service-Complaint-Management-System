-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "closeReason" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "slaHours" INTEGER;
