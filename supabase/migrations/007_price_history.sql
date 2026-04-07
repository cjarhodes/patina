-- Track price history for favorited listings
CREATE TABLE IF NOT EXISTS price_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  price_usd numeric(10,2) NOT NULL,
  checked_at timestamptz DEFAULT now()
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view price history for own favorites"
  ON price_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM favorites f
      WHERE f.listing_id = price_history.listing_id
      AND f.user_id = auth.uid()
    )
  );

CREATE INDEX idx_price_history_listing ON price_history(listing_id);
CREATE INDEX idx_price_history_date ON price_history(checked_at);

-- Add last_checked_price to favorites for quick comparison
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS last_known_price numeric(10,2);
ALTER TABLE favorites ADD COLUMN IF NOT EXISTS price_alert_enabled boolean DEFAULT true;
