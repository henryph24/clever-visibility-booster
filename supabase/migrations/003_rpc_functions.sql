-- Supabase Migration: RPC Functions for Aggregations
-- Run this AFTER 002_rls_policies.sql

-- ============================================
-- AGGREGATE TRAFFIC DATA
-- ============================================

CREATE OR REPLACE FUNCTION aggregate_traffic(
  p_brand_id TEXT,
  p_start_date TIMESTAMPTZ
)
RETURNS TABLE (
  total_sessions BIGINT,
  total_users BIGINT,
  total_engaged_sessions BIGINT,
  total_conversions BIGINT,
  total_revenue NUMERIC
) AS $$
  SELECT
    COALESCE(SUM(sessions), 0)::BIGINT as total_sessions,
    COALESCE(SUM(users), 0)::BIGINT as total_users,
    COALESCE(SUM(engaged_sessions), 0)::BIGINT as total_engaged_sessions,
    COALESCE(SUM(conversions), 0)::BIGINT as total_conversions,
    COALESCE(SUM(revenue), 0)::NUMERIC as total_revenue
  FROM public.ai_traffic_data
  WHERE brand_id = p_brand_id
    AND date >= p_start_date
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- TRAFFIC BY SOURCE
-- ============================================

CREATE OR REPLACE FUNCTION traffic_by_source(
  p_brand_id TEXT,
  p_start_date TIMESTAMPTZ
)
RETURNS TABLE (
  source TEXT,
  total_sessions BIGINT,
  total_users BIGINT,
  total_conversions BIGINT,
  total_revenue NUMERIC
) AS $$
  SELECT
    source,
    COALESCE(SUM(sessions), 0)::BIGINT as total_sessions,
    COALESCE(SUM(users), 0)::BIGINT as total_users,
    COALESCE(SUM(conversions), 0)::BIGINT as total_conversions,
    COALESCE(SUM(revenue), 0)::NUMERIC as total_revenue
  FROM public.ai_traffic_data
  WHERE brand_id = p_brand_id
    AND date >= p_start_date
  GROUP BY source
  ORDER BY total_sessions DESC
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- COUNT PROMPTS FOR BRAND
-- ============================================

CREATE OR REPLACE FUNCTION count_brand_prompts(p_brand_id TEXT)
RETURNS BIGINT AS $$
  SELECT COUNT(*)::BIGINT
  FROM public.prompts p
  JOIN public.topics t ON t.id = p.topic_id
  WHERE t.brand_id = p_brand_id
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- COUNT RESPONSES FOR BRAND
-- ============================================

CREATE OR REPLACE FUNCTION count_brand_responses(p_brand_id TEXT)
RETURNS BIGINT AS $$
  SELECT COUNT(*)::BIGINT
  FROM public.llm_responses r
  JOIN public.prompts p ON p.id = r.prompt_id
  JOIN public.topics t ON t.id = p.topic_id
  WHERE t.brand_id = p_brand_id
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- COUNT BRAND MENTIONS
-- ============================================

CREATE OR REPLACE FUNCTION count_brand_mentions(p_brand_id TEXT)
RETURNS BIGINT AS $$
  SELECT COUNT(*)::BIGINT
  FROM public.brand_mentions m
  WHERE m.brand_id = p_brand_id
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- COUNT COMPETITOR MENTIONS
-- ============================================

CREATE OR REPLACE FUNCTION count_competitor_mentions(p_competitor_id TEXT)
RETURNS BIGINT AS $$
  SELECT COUNT(*)::BIGINT
  FROM public.brand_mentions m
  WHERE m.competitor_id = p_competitor_id
$$ LANGUAGE SQL SECURITY DEFINER;

-- ============================================
-- GET VISIBILITY TRENDS
-- ============================================

CREATE OR REPLACE FUNCTION get_visibility_trends(
  p_brand_id TEXT,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  date TIMESTAMPTZ,
  visibility_pct DOUBLE PRECISION,
  avg_rank DOUBLE PRECISION,
  citation_count INTEGER
) AS $$
  SELECT
    vm.date,
    vm.visibility_pct,
    vm.avg_rank,
    vm.citation_count
  FROM public.visibility_metrics vm
  WHERE vm.brand_id = p_brand_id
    AND vm.date >= p_start_date
    AND vm.date <= p_end_date
  ORDER BY vm.date ASC
$$ LANGUAGE SQL SECURITY DEFINER;
