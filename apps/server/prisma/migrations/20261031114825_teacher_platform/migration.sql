-- AlterTable
ALTER TABLE "Assignment" ADD COLUMN     "groupId" TEXT;

-- AlterTable
ALTER TABLE "RealWorldMeasurement" ADD COLUMN     "classroomId" TEXT;

-- CreateIndex
CREATE INDEX "RealWorldMeasurement_classroomId_taskKey_idx" ON "RealWorldMeasurement"("classroomId", "taskKey");
