-- Patina MVP - Initial Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query)

-- Profiles: extends Supabase auth.users with size preference
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  size_label TEXT NOT NULL DEFAULT 'M',   -- XS, S, M, L, XL, XXL
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can upsert their own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Searches: one row per image search performed
CREATE TABLE IF NOT EXISTS searches (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  image_storage_path TEXT NOT NULL,
  style_signals      JSONB,              -- output of analyze-image function
  size_filter        TEXT NOT NULL DEFAULT 'M',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own searches"
  ON searches FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own searches"
  ON searches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Listings: results returned for a given search
CREATE TABLE IF NOT EXISTS listings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id       UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  platform        TEXT NOT NULL CHECK (platform IN ('ebay', 'etsy')),
  external_id     TEXT NOT NULL,
  title           TEXT NOT NULL,
  price_usd       NUMERIC(10, 2) NOT NULL,
  size_label      TEXT,
  condition       TEXT,
  thumbnail_url   TEXT,
  listing_url     TEXT NOT NULL,
  relevance_score NUMERIC(5, 4) DEFAULT 0,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read listings for their searches"
  ON listings FOR SELECT
  USING (
    search_id IN (SELECT id FROM searches WHERE user_id = auth.uid())
  );

-- Saved searches: up to 3 per user (enforced in app)
CREATE TABLE IF NOT EXISTS saved_searches (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  search_id        UUID NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  last_checked_at  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, search_id)
);
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own saved searches"
  ON saved_searches FOR ALL USING (auth.uid() = user_id);

-- Push tokens: for sending notifications
CREATE TABLE IF NOT EXISTS push_tokens (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token      TEXT NOT NULL,
  platform   TEXT NOT NULL DEFAULT 'ios',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, token)
);
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own push tokens"
  ON push_tokens FOR ALL USING (auth.uid() = user_id);

-- Storage bucket for search images
-- Run this separately in Supabase Dashboard → Storage → New bucket
-- Name: search-images, Public: true (so Vision API can access the URL)
-- Or run via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('search-images', 'search-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload to search-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'search-images');

CREATE POLICY "Anyone can read search-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'search-images');
