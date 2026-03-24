-- CreateTable
CREATE TABLE "TaskVector" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" DOUBLE PRECISION[],

    CONSTRAINT "TaskVector_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskVector_taskId_key" ON "TaskVector"("taskId");

-- CreateIndex
CREATE INDEX "TaskVector_taskId_idx" ON "TaskVector"("taskId");

-- AddForeignKey
ALTER TABLE "TaskVector" ADD CONSTRAINT "TaskVector_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
