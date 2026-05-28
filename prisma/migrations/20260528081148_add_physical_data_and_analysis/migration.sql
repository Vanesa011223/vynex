-- AlterTable
ALTER TABLE "PlayerMatchStats" ADD COLUMN "km" REAL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "birthDate" DATETIME;
ALTER TABLE "User" ADD COLUMN "dominantFoot" TEXT;
ALTER TABLE "User" ADD COLUMN "height" REAL;
ALTER TABLE "User" ADD COLUMN "weight" REAL;

-- CreateTable
CREATE TABLE "MatchAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "notes" TEXT,
    "aiAnalysis" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MatchAnalysis_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "MatchAnalysis_matchId_key" ON "MatchAnalysis"("matchId");
