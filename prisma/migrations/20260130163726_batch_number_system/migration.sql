/*
  Warnings:

  - You are about to drop the column `batch` on the `Quiz` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Quiz` DROP COLUMN `batch`,
    ADD COLUMN `batchNumber` INTEGER NULL;

-- AlterTable
ALTER TABLE `User` ADD COLUMN `batchNumber` INTEGER NULL;
