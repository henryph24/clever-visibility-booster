-- Supabase Migration: Prisma PostgreSQL to Supabase
-- Run this in the Supabase SQL Editor

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE llm_provider AS ENUM ('OPENAI', 'ANTHROPIC', 'GOOGLE', 'PERPLEXITY');
CREATE TYPE content_type AS ENUM ('BLOG', 'LANDING', 'COMPARISON', 'FAQ', 'GUIDE');
CREATE TYPE recommendation_type AS ENUM ('CONTENT', 'TECHNICAL', 'OUTREACH', 'COMPETITOR');
CREATE TYPE recommendation_priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');
CREATE TYPE recommendation_status AS ENUM ('PENDING', 'DONE', 'DISMISSED');

-- ============================================
-- PROFILES (extends auth.users)
-- ============================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  image TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, image)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- BRANDS
-- ============================================

CREATE TABLE public.brands (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  industry TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX brands_user_id_idx ON public.brands(user_id);

CREATE TRIGGER brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- COMPETITORS
-- ============================================

CREATE TABLE public.competitors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX competitors_brand_id_idx ON public.competitors(brand_id);

-- ============================================
-- TOPICS
-- ============================================

CREATE TABLE public.topics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  auto_generated BOOLEAN DEFAULT false NOT NULL,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX topics_brand_id_idx ON public.topics(brand_id);

-- ============================================
-- PROMPTS
-- ============================================

CREATE TABLE public.prompts (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  text TEXT NOT NULL,
  topic_id TEXT NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX prompts_topic_id_idx ON public.prompts(topic_id);

-- ============================================
-- LLM RESPONSES
-- ============================================

CREATE TABLE public.llm_responses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  prompt_id TEXT NOT NULL REFERENCES public.prompts(id) ON DELETE CASCADE,
  provider llm_provider NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX llm_responses_prompt_id_idx ON public.llm_responses(prompt_id);

-- ============================================
-- BRAND MENTIONS
-- ============================================

CREATE TABLE public.brand_mentions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  response_id TEXT NOT NULL REFERENCES public.llm_responses(id) ON DELETE CASCADE,
  brand_id TEXT,
  competitor_id TEXT REFERENCES public.competitors(id) ON DELETE SET NULL,
  brand_name TEXT NOT NULL,
  rank_position INTEGER,
  is_cited BOOLEAN DEFAULT false NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX brand_mentions_response_id_idx ON public.brand_mentions(response_id);
CREATE INDEX brand_mentions_brand_id_idx ON public.brand_mentions(brand_id);
CREATE INDEX brand_mentions_competitor_id_idx ON public.brand_mentions(competitor_id);

-- ============================================
-- CITED SOURCES
-- ============================================

CREATE TABLE public.cited_sources (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  response_id TEXT NOT NULL REFERENCES public.llm_responses(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  domain TEXT NOT NULL,
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX cited_sources_response_id_idx ON public.cited_sources(response_id);
CREATE INDEX cited_sources_domain_idx ON public.cited_sources(domain);

-- ============================================
-- VISIBILITY METRICS
-- ============================================

CREATE TABLE public.visibility_metrics (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  visibility_pct DOUBLE PRECISION NOT NULL,
  avg_rank DOUBLE PRECISION,
  citation_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(brand_id, date)
);

CREATE INDEX visibility_metrics_brand_id_idx ON public.visibility_metrics(brand_id);

-- ============================================
-- ANALYTICS CONNECTIONS
-- ============================================

CREATE TABLE public.analytics_connections (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE UNIQUE,
  provider TEXT DEFAULT 'GA4' NOT NULL,
  property_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TRIGGER analytics_connections_updated_at
  BEFORE UPDATE ON public.analytics_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- AI TRAFFIC DATA
-- ============================================

CREATE TABLE public.ai_traffic_data (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  source TEXT NOT NULL,
  sessions INTEGER DEFAULT 0 NOT NULL,
  users INTEGER DEFAULT 0 NOT NULL,
  engaged_sessions INTEGER DEFAULT 0 NOT NULL,
  conversions INTEGER DEFAULT 0 NOT NULL,
  revenue DOUBLE PRECISION DEFAULT 0 NOT NULL,
  bounce_rate DOUBLE PRECISION,
  avg_session_duration DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(brand_id, date, source)
);

CREATE INDEX ai_traffic_data_brand_id_date_idx ON public.ai_traffic_data(brand_id, date);

-- ============================================
-- GENERATED CONTENT
-- ============================================

CREATE TABLE public.generated_content (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  topic_id TEXT REFERENCES public.topics(id) ON DELETE SET NULL,
  content_type content_type NOT NULL,
  content TEXT NOT NULL,
  reference_urls TEXT[] DEFAULT '{}' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX generated_content_brand_id_idx ON public.generated_content(brand_id);

-- ============================================
-- RECOMMENDATIONS
-- ============================================

CREATE TABLE public.recommendations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  type recommendation_type NOT NULL,
  priority recommendation_priority NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  impact TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_label TEXT NOT NULL,
  action_data JSONB,
  status recommendation_status DEFAULT 'PENDING' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX recommendations_brand_id_status_idx ON public.recommendations(brand_id, status);

CREATE TRIGGER recommendations_updated_at
  BEFORE UPDATE ON public.recommendations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- SIMULATION RESULTS
-- ============================================

CREATE TABLE public.simulation_results (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  brand_id TEXT NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  original_content TEXT NOT NULL,
  modified_content TEXT NOT NULL,
  prompt_ids TEXT[] DEFAULT '{}' NOT NULL,
  results JSONB NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX simulation_results_brand_id_idx ON public.simulation_results(brand_id);
