-- Materialized view for trending searches (garment types + decades)
-- Uses a simple count of searches in the last 7 days
CREATE OR REPLACE VIEW trending_searches AS
SELECT
  style_signals->>'garment_type' as garment_type,
  style_signals->>'decade_range' as decade_range,
  style_signals->>'brand' as brand,
  COUNT(*) as search_count,
  MAX(created_at) as last_searched
FROM searches
WHERE created_at > now() - interval '7 days'
  AND style_signals->>'garment_type' IS NOT NULL
GROUP BY
  style_signals->>'garment_type',
  style_signals->>'decade_range',
  style_signals->>'brand'
ORDER BY search_count DESC
LIMIT 10;

-- Allow all authenticated users to read trending (it's aggregate data, no PII)
-- Views inherit from the base table's RLS, so we need a function
CREATE OR REPLACE FUNCTION get_trending_searches()
RETURNS TABLE (
  garment_type text,
  decade_range text,
  brand text,
  search_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    style_signals->>'garment_type' as garment_type,
    style_signals->>'decade_range' as decade_range,
    style_signals->>'brand' as brand,
    COUNT(*) as search_count
  FROM searches
  WHERE created_at > now() - interval '7 days'
    AND style_signals->>'garment_type' IS NOT NULL
  GROUP BY
    style_signals->>'garment_type',
    style_signals->>'decade_range',
    style_signals->>'brand'
  ORDER BY search_count DESC
  LIMIT 8;
$$;
