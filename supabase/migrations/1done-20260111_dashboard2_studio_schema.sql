-- ============================================
-- Dashboard2 Complete Schema
-- Run this migration to set up the new tables
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Handle updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STUDIO PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.studio_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL DEFAULT 'Untitled Project',
  description TEXT,
  
  -- Initial Brief
  prompt TEXT NOT NULL,
  reference_image_url TEXT,
  visual_style TEXT,
  user_notes TEXT,
  uploaded_files JSONB DEFAULT '[]',
  
  -- Project Settings
  shot_count INTEGER DEFAULT 5,
  aspect_ratio TEXT DEFAULT '16:9',
  
  -- Workflow State
  current_step TEXT DEFAULT 'concept' CHECK (current_step IN (
    'concept', 'storyline', 'hero-image', 'storyboard', 'generation', 'editor'
  )),
  
  -- Selected Data (JSON for flexibility)
  selected_concept JSONB,
  selected_hero_images JSONB DEFAULT '[]',
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in-progress', 'completed')),
  
  -- Credits tracking
  estimated_credits INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS Policies for studio_projects
ALTER TABLE public.studio_projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can CRUD own studio projects" ON public.studio_projects;
CREATE POLICY "Users can CRUD own studio projects" ON public.studio_projects
  FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_studio_projects_user_id ON public.studio_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_studio_projects_status ON public.studio_projects(status);
CREATE INDEX IF NOT EXISTS idx_studio_projects_created_at ON public.studio_projects(created_at DESC);

-- Updated_at trigger
DROP TRIGGER IF EXISTS set_studio_projects_updated_at ON public.studio_projects;
CREATE TRIGGER set_studio_projects_updated_at
  BEFORE UPDATE ON public.studio_projects
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STUDIO CONCEPTS TABLE
-- Generated concepts for a project
-- ============================================
CREATE TABLE IF NOT EXISTS public.studio_concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.studio_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Concept Data
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  visual_style TEXT,
  color_palette TEXT,
  pacing TEXT,
  camera_work TEXT,
  key_moments JSONB DEFAULT '[]',
  
  -- Selection
  is_selected BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.studio_concepts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access concepts from own projects" ON public.studio_concepts;
CREATE POLICY "Users can access concepts from own projects" ON public.studio_concepts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.studio_projects
      WHERE studio_projects.id = studio_concepts.project_id
      AND studio_projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_studio_concepts_project_id ON public.studio_concepts(project_id);

-- ============================================
-- STUDIO SHOTS TABLE (Storyline)
-- Individual shots in the video
-- ============================================
CREATE TABLE IF NOT EXISTS public.studio_shots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.studio_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Shot Data
  order_index INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  voiceover_action TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(project_id, order_index)
);

ALTER TABLE public.studio_shots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access shots from own projects" ON public.studio_shots;
CREATE POLICY "Users can access shots from own projects" ON public.studio_shots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.studio_projects
      WHERE studio_projects.id = studio_shots.project_id
      AND studio_projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_studio_shots_project_id ON public.studio_shots(project_id);
CREATE INDEX IF NOT EXISTS idx_studio_shots_order ON public.studio_shots(project_id, order_index);

DROP TRIGGER IF EXISTS set_studio_shots_updated_at ON public.studio_shots;
CREATE TRIGGER set_studio_shots_updated_at
  BEFORE UPDATE ON public.studio_shots
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STUDIO HERO IMAGES TABLE
-- Generated hero/reference images
-- ============================================
CREATE TABLE IF NOT EXISTS public.studio_hero_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.studio_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Image Data
  url TEXT NOT NULL,
  prompt TEXT NOT NULL,
  label TEXT,
  type TEXT DEFAULT 'hero' CHECK (type IN ('hero', 'product', 'style', 'environment')),
  
  -- Selection
  is_selected BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.studio_hero_images ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access hero images from own projects" ON public.studio_hero_images;
CREATE POLICY "Users can access hero images from own projects" ON public.studio_hero_images
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.studio_projects
      WHERE studio_projects.id = studio_hero_images.project_id
      AND studio_projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_studio_hero_images_project_id ON public.studio_hero_images(project_id);

-- ============================================
-- STUDIO FRAMES TABLE
-- Start/end frames for each shot
-- ============================================
CREATE TABLE IF NOT EXISTS public.studio_frames (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shot_id UUID REFERENCES public.studio_shots(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.studio_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Frame Data
  frame_type TEXT NOT NULL CHECK (frame_type IN ('start', 'end')),
  url TEXT,
  prompt TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  UNIQUE(shot_id, frame_type)
);

ALTER TABLE public.studio_frames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access frames from own projects" ON public.studio_frames;
CREATE POLICY "Users can access frames from own projects" ON public.studio_frames
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.studio_projects
      WHERE studio_projects.id = studio_frames.project_id
      AND studio_projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_studio_frames_shot_id ON public.studio_frames(shot_id);
CREATE INDEX IF NOT EXISTS idx_studio_frames_project_id ON public.studio_frames(project_id);

DROP TRIGGER IF EXISTS set_studio_frames_updated_at ON public.studio_frames;
CREATE TRIGGER set_studio_frames_updated_at
  BEFORE UPDATE ON public.studio_frames
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STUDIO MOTION PROMPTS TABLE
-- Video direction for each shot
-- ============================================
CREATE TABLE IF NOT EXISTS public.studio_motion_prompts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shot_id UUID REFERENCES public.studio_shots(id) ON DELETE CASCADE NOT NULL UNIQUE,
  project_id UUID REFERENCES public.studio_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Motion Data
  prompt TEXT NOT NULL,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.studio_motion_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access motion prompts from own projects" ON public.studio_motion_prompts;
CREATE POLICY "Users can access motion prompts from own projects" ON public.studio_motion_prompts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.studio_projects
      WHERE studio_projects.id = studio_motion_prompts.project_id
      AND studio_projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_studio_motion_prompts_shot_id ON public.studio_motion_prompts(shot_id);

DROP TRIGGER IF EXISTS set_studio_motion_prompts_updated_at ON public.studio_motion_prompts;
CREATE TRIGGER set_studio_motion_prompts_updated_at
  BEFORE UPDATE ON public.studio_motion_prompts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STUDIO VIDEOS TABLE
-- Final generated videos for each shot
-- ============================================
CREATE TABLE IF NOT EXISTS public.studio_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  shot_id UUID REFERENCES public.studio_shots(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.studio_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- Video Data
  url TEXT,
  download_url TEXT,
  duration_seconds NUMERIC(5, 2),
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'failed')),
  error_message TEXT,
  
  -- Approval
  is_approved BOOLEAN DEFAULT FALSE,
  
  -- Credits
  credits_cost INTEGER DEFAULT 10,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE public.studio_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access videos from own projects" ON public.studio_videos;
CREATE POLICY "Users can access videos from own projects" ON public.studio_videos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.studio_projects
      WHERE studio_projects.id = studio_videos.project_id
      AND studio_projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_studio_videos_shot_id ON public.studio_videos(shot_id);
CREATE INDEX IF NOT EXISTS idx_studio_videos_project_id ON public.studio_videos(project_id);
CREATE INDEX IF NOT EXISTS idx_studio_videos_status ON public.studio_videos(status);

DROP TRIGGER IF EXISTS set_studio_videos_updated_at ON public.studio_videos;
CREATE TRIGGER set_studio_videos_updated_at
  BEFORE UPDATE ON public.studio_videos
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- STUDIO GENERATION LOG TABLE
-- Track all AI generation requests
-- ============================================
CREATE TABLE IF NOT EXISTS public.studio_generation_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.studio_projects(id) ON DELETE CASCADE NOT NULL,
  
  -- What was generated
  generation_type TEXT NOT NULL CHECK (generation_type IN (
    'concept', 'storyline', 'hero_image', 'storyboard_frame', 'motion_prompt', 'video'
  )),
  
  -- Reference to specific item (optional)
  reference_id UUID,
  
  -- AI Details
  model_used TEXT NOT NULL,
  prompt_used TEXT,
  
  -- Status
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  error_message TEXT,
  
  -- Result summary
  result_summary TEXT,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.studio_generation_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access logs from own projects" ON public.studio_generation_log;
CREATE POLICY "Users can access logs from own projects" ON public.studio_generation_log
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.studio_projects
      WHERE studio_projects.id = studio_generation_log.project_id
      AND studio_projects.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_studio_generation_log_project_id ON public.studio_generation_log(project_id);
CREATE INDEX IF NOT EXISTS idx_studio_generation_log_type ON public.studio_generation_log(generation_type);
