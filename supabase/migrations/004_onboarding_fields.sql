-- Add onboarding and style preference fields to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS style_preferences text[] DEFAULT '{}';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS favorite_decades text[] DEFAULT '{}';
