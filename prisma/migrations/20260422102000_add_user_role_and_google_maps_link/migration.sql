-- Add role enum and role column for users
DO $$
BEGIN
    CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VISITOR');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "role" "UserRole" NOT NULL DEFAULT 'VISITOR';

-- Add optional Google Maps link field for places
ALTER TABLE "Place"
ADD COLUMN IF NOT EXISTS "googleMapsLink" TEXT;
