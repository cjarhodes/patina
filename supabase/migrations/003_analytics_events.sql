-- Analytics events table for tracking user behavior
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own events" ON analytics_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
