-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "fileActualName" TEXT,
ADD COLUMN     "fileName" TEXT,
ADD COLUMN     "fileSize" INTEGER,
ALTER COLUMN "messageContent" DROP NOT NULL;
