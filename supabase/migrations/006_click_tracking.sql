-- Track affiliate link clicks for conversion analytics
CREATE TABLE IF NOT EXISTS link_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  search_id uuid REFERENCES searches(id) ON DELETE CASCADE,
  platform text NOT NULL, -- 'ebay' or 'etsy'
  listing_url text NOT NULL,
  affiliate_url text NOT NULL,
  clicked_at timestamptz DEFAULT now()
);

ALTER TABLE link_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own clicks"
  ON link_clicks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own clicks"
  ON link_clicks FOR SELECT
  USING (auth.uid() = user_id);

CREATE INDEX idx_link_clicks_user ON link_clicks(user_id);
CREATE INDEX idx_link_clicks_platform ON link_clicks(platform);
CREATE INDEX idx_link_clicks_date ON link_clicks(clicked_at);
