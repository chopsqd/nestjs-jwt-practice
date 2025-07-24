/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_agent` to the `tokens` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `exp` on the `tokens` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "tokens" ADD COLUMN     "user_agent" TEXT NOT NULL,
DROP COLUMN "exp",
ADD COLUMN     "exp" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
