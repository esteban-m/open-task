-- AlterTable: couleur des listes
ALTER TABLE "TaskList" ADD COLUMN IF NOT EXISTS "color" TEXT DEFAULT '#3B82F6';

-- CreateTable: partage de listes (si absent)
CREATE TABLE IF NOT EXISTS "UserList" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "status" TEXT NOT NULL DEFAULT 'accepted',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserList_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserList_userId_listId_key" ON "UserList"("userId", "listId");

DO $$ BEGIN
  ALTER TABLE "UserList" ADD CONSTRAINT "UserList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "UserList" ADD CONSTRAINT "UserList_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TaskList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- CreateTable: invitations de partage (si absent)
CREATE TABLE IF NOT EXISTS "ShareInvitation" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "shareRole" TEXT NOT NULL DEFAULT 'viewer',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareInvitation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ShareInvitation_listId_invitedEmail_key" ON "ShareInvitation"("listId", "invitedEmail");

DO $$ BEGIN
  ALTER TABLE "ShareInvitation" ADD CONSTRAINT "ShareInvitation_listId_fkey" FOREIGN KEY ("listId") REFERENCES "TaskList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
