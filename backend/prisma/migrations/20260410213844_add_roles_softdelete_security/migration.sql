/*
  Warnings:

  - You are about to drop the column `refresh_token` on the `users` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `analytics_data` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `chat_messages` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `recommendations` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `user_exercises` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- DropIndex
DROP INDEX "analytics_data_period_start_period_end_idx";

-- DropIndex
DROP INDEX "analytics_data_user_id_idx";

-- DropIndex
DROP INDEX "chat_messages_conversation_id_idx";

-- DropIndex
DROP INDEX "chat_messages_created_at_idx";

-- DropIndex
DROP INDEX "chat_messages_user_id_idx";

-- DropIndex
DROP INDEX "journal_entries_created_at_idx";

-- DropIndex
DROP INDEX "journal_entries_user_id_idx";

-- DropIndex
DROP INDEX "moods_created_at_idx";

-- DropIndex
DROP INDEX "moods_user_id_idx";

-- DropIndex
DROP INDEX "recommendations_user_id_idx";

-- DropIndex
DROP INDEX "user_exercises_user_id_idx";

-- AlterTable
ALTER TABLE "analytics_data" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "chat_messages" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "journal_entries" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "moods" ADD COLUMN     "is_deleted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "recommendations" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "user_exercises" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "refresh_token",
ADD COLUMN     "last_login_at" TIMESTAMP(3),
ADD COLUMN     "refresh_token_hash" TEXT,
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'USER';

-- CreateIndex
CREATE INDEX "analytics_data_user_id_period_start_period_end_idx" ON "analytics_data"("user_id", "period_start", "period_end");

-- CreateIndex
CREATE INDEX "chat_messages_user_id_conversation_id_idx" ON "chat_messages"("user_id", "conversation_id");

-- CreateIndex
CREATE INDEX "chat_messages_conversation_id_created_at_idx" ON "chat_messages"("conversation_id", "created_at");

-- CreateIndex
CREATE INDEX "contents_type_idx" ON "contents"("type");

-- CreateIndex
CREATE INDEX "contents_is_active_idx" ON "contents"("is_active");

-- CreateIndex
CREATE INDEX "exercises_category_idx" ON "exercises"("category");

-- CreateIndex
CREATE INDEX "exercises_difficulty_idx" ON "exercises"("difficulty");

-- CreateIndex
CREATE INDEX "exercises_is_active_idx" ON "exercises"("is_active");

-- CreateIndex
CREATE INDEX "journal_entries_user_id_created_at_idx" ON "journal_entries"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "journal_entries_user_id_is_deleted_idx" ON "journal_entries"("user_id", "is_deleted");

-- CreateIndex
CREATE INDEX "moods_user_id_created_at_idx" ON "moods"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "moods_user_id_is_deleted_idx" ON "moods"("user_id", "is_deleted");

-- CreateIndex
CREATE INDEX "recommendations_user_id_viewed_idx" ON "recommendations"("user_id", "viewed");

-- CreateIndex
CREATE INDEX "user_exercises_user_id_completed_at_idx" ON "user_exercises"("user_id", "completed_at");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");
