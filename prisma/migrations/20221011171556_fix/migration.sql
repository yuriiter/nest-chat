/*
  Warnings:

  - You are about to drop the column `interactedUserId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `interactingUserId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `userStatus` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_interactedUserId_fkey";

-- DropIndex
DROP INDEX "User_interactedUserId_key";

-- DropIndex
DROP INDEX "User_interactingUserId_key";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "sentDateTime" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "isRead" SET DEFAULT false;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "interactedUserId",
DROP COLUMN "interactingUserId",
DROP COLUMN "userStatus";

-- DropEnum
DROP TYPE "UserStatus";
