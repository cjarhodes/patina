-- Enable RLS on debug_logs (was publicly accessible)
ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Only service role (edge functions / admin) can access debug logs
CREATE POLICY "Service role full access to debug logs"
  ON debug_logs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
