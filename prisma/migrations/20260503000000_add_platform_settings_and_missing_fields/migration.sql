-- AlterTable: add targetSemester to Quiz
ALTER TABLE `Quiz` ADD COLUMN `targetSemester` INTEGER NULL;

-- AlterTable: add timeSpent to QuizAttempt
ALTER TABLE `QuizAttempt` ADD COLUMN `timeSpent` INTEGER NOT NULL DEFAULT 0;

-- CreateTable: PlatformSettings singleton
CREATE TABLE `PlatformSettings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `allowedEmailDomains` TEXT NOT NULL DEFAULT '[]',
    `studentIdLabel` VARCHAR(50) NOT NULL DEFAULT 'Campus ID',
    `studentIdFormat` VARCHAR(20) NOT NULL DEFAULT 'ANY',
    `studentIdMinLength` INTEGER NOT NULL DEFAULT 1,
    `studentIdMaxLength` INTEGER NOT NULL DEFAULT 50,
    `studentIdRequired` BOOLEAN NOT NULL DEFAULT false,
    `rollNumberLabel` VARCHAR(50) NOT NULL DEFAULT 'Registration Number',
    `rollNumberFormat` VARCHAR(20) NOT NULL DEFAULT 'ANY',
    `rollNumberMinLength` INTEGER NOT NULL DEFAULT 1,
    `rollNumberMaxLength` INTEGER NOT NULL DEFAULT 50,
    `rollNumberRequired` BOOLEAN NOT NULL DEFAULT true,
    `maxSemester` INTEGER NOT NULL DEFAULT 8,
    `availableBatches` TEXT NOT NULL DEFAULT '[]',
    `maxBatchNumber` INTEGER NOT NULL DEFAULT 13,
    `enableYearTargeting` BOOLEAN NOT NULL DEFAULT true,
    `enableSemesterTargeting` BOOLEAN NOT NULL DEFAULT true,
    `enableBatchTargeting` BOOLEAN NOT NULL DEFAULT true,
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
