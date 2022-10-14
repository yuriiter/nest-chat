/*
  Warnings:

  - Added the required column `messageContent` to the `Message` table without a default value. This is not possible if the table is not empty.
  - Added the required column `messageType` to the `Message` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'FILE', 'IMAGE', 'RECORDING');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "messageContent" TEXT NOT NULL,
ADD COLUMN     "messageType" "MessageType" NOT NULL;
