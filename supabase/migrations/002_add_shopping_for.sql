-- Add shopping_for preference to profiles
-- Run in Supabase → SQL Editor

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS shopping_for TEXT NOT NULL DEFAULT 'womens'
  CHECK (shopping_for IN ('womens', 'mens', 'both'));
