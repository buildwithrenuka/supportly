-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('customer', 'admin');

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'customer';
