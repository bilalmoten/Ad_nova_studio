-- ============================================
-- Studio 2.0 (V2) Complete Schema
-- "The Non-Linear Cockpit & Sequencer"
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Handle updated_at trigger function (reusing if exists, creating if not)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 1. V2 PROJECTS TABLE
-- Workspace container with Global Anchors
-- ============================================
CREATE TABLE IF NOT EXISTS public.v2_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  
  -- Settings & Context
  settings JSONB DEFAULT '{}', -- Aspect ratios, default models
  anchors JSONB DEFAULT '[]',  -- Global Anchors (Character references, Style guides)
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE public.v2_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own v2 projects" ON public.v2_projects;
CREATE POLICY "Users can CRUD own v2 projects" ON public.v2_projects
  FOR ALL USING (auth.uid() = user_id);

-- Triggers
CREATE TRIGGER set_v2_projects_updated_at
  BEFORE UPDATE ON public.v2_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================
-- 2. V2 ASSETS TABLE
-- The Universal Bin: Scripts, Images, Videos, Audio
-- ============================================
CREATE TABLE IF NOT EXISTS public.v2_assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.v2_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Asset Type
  type TEXT NOT NULL CHECK (type IN ('script', 'image', 'video', 'audio', 'prompt_template')),
  
  -- Content location
  content TEXT,       -- For scripts, prompts, or raw text
  media_url TEXT,     -- For Images/Videos (Storage Key or Public URL)
  
  -- Relationships (Lineage)
  parent_id UUID REFERENCES public.v2_assets(id), -- For variations, upsizing, remixed versions
  group_id UUID,                                  -- Links 4 items of a 2x2 grid together
  
  -- AI & Processing Metadata
  metadata JSONB DEFAULT '{}',     -- Stores: prompt, seed, model, duration, camera_settings
  grid_config JSONB,               -- If this is a sprite sheet: { rows: 2, cols: 2 }
  
  -- Status & Management
  status TEXT DEFAULT 'ready' CHECK (status IN ('processing', 'ready', 'failed')),
  error_message TEXT,
  
  token_cost INTEGER DEFAULT 0,    -- Usage tracking
  
  -- Garbage Collection & Organization
  is_temporary BOOLEAN DEFAULT TRUE, -- TRUE = Delete after 24h unless saved
  is_favorite BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE public.v2_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own v2 assets" ON public.v2_assets;
CREATE POLICY "Users can CRUD own v2 assets" ON public.v2_assets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.v2_projects
      WHERE v2_projects.id = v2_assets.project_id
      AND v2_projects.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_v2_assets_project_id ON public.v2_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_v2_assets_type ON public.v2_assets(type);
CREATE INDEX IF NOT EXISTS idx_v2_assets_temp_created ON public.v2_assets(created_at) WHERE is_temporary = TRUE;
CREATE INDEX IF NOT EXISTS idx_v2_assets_group_id ON public.v2_assets(group_id);

-- Triggers
CREATE TRIGGER set_v2_assets_updated_at
  BEFORE UPDATE ON public.v2_assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ============================================
-- 3. V2 SEQUENCES TABLE
-- The NLE Timelines
-- ============================================
CREATE TABLE IF NOT EXISTS public.v2_sequences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.v2_projects(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL DEFAULT 'Main Sequence',
  
  -- The Timeline Data
  -- Stores tracks, clips, in/out points, effects
  -- JSONB is faster for NLE state than relational tables
  tracks JSONB DEFAULT '[]', 
  
  settings JSONB DEFAULT '{"fps": 24, "resolution": "1080p"}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS
ALTER TABLE public.v2_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own v2 sequences" ON public.v2_sequences;
CREATE POLICY "Users can CRUD own v2 sequences" ON public.v2_sequences
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.v2_projects
      WHERE v2_projects.id = v2_sequences.project_id
      AND v2_projects.user_id = auth.uid()
    )
  );

-- Triggers
CREATE TRIGGER set_v2_sequences_updated_at
  BEFORE UPDATE ON public.v2_sequences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
