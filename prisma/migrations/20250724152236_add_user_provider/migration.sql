-- CreateEnum
CREATE TYPE "Provider" AS ENUM ('GOOGLE', 'YANDEX');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "provider" "Provider",
ALTER COLUMN "password" DROP NOT NULL;
