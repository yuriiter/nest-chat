-- AlterTable
ALTER TABLE "User" ADD COLUMN     "socketIds" TEXT[] DEFAULT ARRAY[]::TEXT[];
