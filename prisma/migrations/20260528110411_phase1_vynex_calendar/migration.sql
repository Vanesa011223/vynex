-- CreateTable
CREATE TABLE "TeamContext" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "teamName" TEXT NOT NULL DEFAULT 'Mi equipo',
    "season" TEXT NOT NULL DEFAULT '2025/26',
    "competition" TEXT NOT NULL DEFAULT '',
    "playingStyle" TEXT NOT NULL DEFAULT '',
    "weekMessage" TEXT NOT NULL DEFAULT '',
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "objectives" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
