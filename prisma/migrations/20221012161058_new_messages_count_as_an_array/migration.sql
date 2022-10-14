/*
  Warnings:

  - You are about to drop the column `countOfNewMessagesToUser1` on the `Chat` table. All the data in the column will be lost.
  - You are about to drop the column `countOfNewMessagesToUser2` on the `Chat` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Chat" DROP COLUMN "countOfNewMessagesToUser1",
DROP COLUMN "countOfNewMessagesToUser2",
ADD COLUMN     "countOfNewMessagesToUsers" INTEGER[] DEFAULT ARRAY[0, 0]::INTEGER[];
