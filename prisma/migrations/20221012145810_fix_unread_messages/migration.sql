/*
  Warnings:

  - You are about to drop the column `isRead` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "countOfNewMessagesToUser1" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "countOfNewMessagesToUser2" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "isRead";
