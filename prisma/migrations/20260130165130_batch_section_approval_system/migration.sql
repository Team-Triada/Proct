/*
  Warnings:

  - You are about to drop the column `batchNumber` on the `Quiz` table. All the data in the column will be lost.
  - You are about to drop the column `batchNumber` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `Quiz` DROP COLUMN `batchNumber`,
    ADD COLUMN `targetBatch` VARCHAR(20) NULL,
    ADD COLUMN `targetSection` VARCHAR(10) NULL;

-- AlterTable
ALTER TABLE `Subject` ADD COLUMN `isApproved` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `User` DROP COLUMN `batchNumber`,
    ADD COLUMN `section` VARCHAR(10) NULL;
