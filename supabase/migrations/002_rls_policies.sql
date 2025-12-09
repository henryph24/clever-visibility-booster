-- Supabase Migration: Row Level Security Policies
-- Run this AFTER 001_initial_schema.sql

-- ============================================
-- ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llm_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cited_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visibility_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_traffic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulation_results ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- BRANDS POLICIES
-- ============================================

CREATE POLICY "Users can view own brands"
  ON public.brands FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create brands"
  ON public.brands FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brands"
  ON public.brands FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brands"
  ON public.brands FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- COMPETITORS POLICIES (via brand ownership)
-- ============================================

CREATE POLICY "Users can manage competitors via brand"
  ON public.competitors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = competitors.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- TOPICS POLICIES (via brand ownership)
-- ============================================

CREATE POLICY "Users can manage topics via brand"
  ON public.topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = topics.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- PROMPTS POLICIES (via topic -> brand)
-- ============================================

CREATE POLICY "Users can manage prompts via topic"
  ON public.prompts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.topics
      JOIN public.brands ON brands.id = topics.brand_id
      WHERE topics.id = prompts.topic_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- LLM RESPONSES POLICIES (via prompt -> topic -> brand)
-- ============================================

CREATE POLICY "Users can manage responses via prompt"
  ON public.llm_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.prompts
      JOIN public.topics ON topics.id = prompts.topic_id
      JOIN public.brands ON brands.id = topics.brand_id
      WHERE prompts.id = llm_responses.prompt_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- BRAND MENTIONS POLICIES (via response -> prompt -> topic -> brand)
-- ============================================

CREATE POLICY "Users can manage mentions via response"
  ON public.brand_mentions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.llm_responses
      JOIN public.prompts ON prompts.id = llm_responses.prompt_id
      JOIN public.topics ON topics.id = prompts.topic_id
      JOIN public.brands ON brands.id = topics.brand_id
      WHERE llm_responses.id = brand_mentions.response_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- CITED SOURCES POLICIES (via response -> prompt -> topic -> brand)
-- ============================================

CREATE POLICY "Users can manage sources via response"
  ON public.cited_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.llm_responses
      JOIN public.prompts ON prompts.id = llm_responses.prompt_id
      JOIN public.topics ON topics.id = prompts.topic_id
      JOIN public.brands ON brands.id = topics.brand_id
      WHERE llm_responses.id = cited_sources.response_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- VISIBILITY METRICS POLICIES (via brand)
-- ============================================

CREATE POLICY "Users can manage metrics via brand"
  ON public.visibility_metrics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = visibility_metrics.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- ANALYTICS CONNECTIONS POLICIES (via brand)
-- ============================================

CREATE POLICY "Users can manage analytics via brand"
  ON public.analytics_connections FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = analytics_connections.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- AI TRAFFIC DATA POLICIES (via brand)
-- ============================================

CREATE POLICY "Users can manage traffic data via brand"
  ON public.ai_traffic_data FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = ai_traffic_data.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- GENERATED CONTENT POLICIES (via brand)
-- ============================================

CREATE POLICY "Users can manage generated content via brand"
  ON public.generated_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = generated_content.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- RECOMMENDATIONS POLICIES (via brand)
-- ============================================

CREATE POLICY "Users can manage recommendations via brand"
  ON public.recommendations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = recommendations.brand_id
      AND brands.user_id = auth.uid()
    )
  );

-- ============================================
-- SIMULATION RESULTS POLICIES (via brand)
-- ============================================

CREATE POLICY "Users can manage simulations via brand"
  ON public.simulation_results FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.brands
      WHERE brands.id = simulation_results.brand_id
      AND brands.user_id = auth.uid()
    )
  );
