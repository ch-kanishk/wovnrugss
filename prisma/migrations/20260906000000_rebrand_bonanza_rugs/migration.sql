-- Rebrand: Wovn Rugs -> Bonanza Rugs.
-- The init migration is already applied in every environment, so its
-- DEFAULT 'Wovn Rugs' is corrected here rather than edited in place —
-- rewriting an applied migration breaks Prisma's checksum.

-- New posts default to the new brand name.
ALTER TABLE "Post" ALTER COLUMN "author" SET DEFAULT 'Bonanza Rugs';

-- Existing rows still carry the old default.
UPDATE "Post" SET "author" = 'Bonanza Rugs' WHERE "author" = 'Wovn Rugs';
