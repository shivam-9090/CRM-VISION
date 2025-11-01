/*
  Warnings:

  - The values [PROPOSAL] on the enum `DealStage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "DealStage_new" AS ENUM ('LEAD', 'QUALIFIED', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST');
ALTER TABLE "public"."deals" ALTER COLUMN "stage" DROP DEFAULT;
ALTER TABLE "deals" ALTER COLUMN "stage" TYPE "DealStage_new" USING ("stage"::text::"DealStage_new");
ALTER TYPE "DealStage" RENAME TO "DealStage_old";
ALTER TYPE "DealStage_new" RENAME TO "DealStage";
DROP TYPE "public"."DealStage_old";
ALTER TABLE "deals" ALTER COLUMN "stage" SET DEFAULT 'LEAD';
COMMIT;
