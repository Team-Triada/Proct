/*
  Warnings:

  - You are about to drop the column `targetBatch` on the `Quiz` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Quiz` DROP COLUMN `targetBatch`,
    ADD COLUMN `assignedBatches` JSON NULL,
    ADD COLUMN `timingMode` VARCHAR(20) NOT NULL DEFAULT 'PER_QUESTION',
    ADD COLUMN `totalDuration` INTEGER NULL;

-- AlterTable
ALTER TABLE `QuizAttempt` ADD COLUMN `currentQuestionStartTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `lastActivityAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `reloadCount` INTEGER NOT NULL DEFAULT 0;
