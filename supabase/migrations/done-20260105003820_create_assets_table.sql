-- Create assets table
CREATE TABLE public.assets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID REFERENCES public.generations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'video', 'audio')),
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

-- Create policies - Users can only access assets from their own projects
CREATE POLICY "Users can view assets from own projects" ON public.assets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.generations
      JOIN public.projects ON projects.id = generations.project_id
      WHERE generations.id = assets.generation_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert assets to own projects" ON public.assets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.generations
      JOIN public.projects ON projects.id = generations.project_id
      WHERE generations.id = assets.generation_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete assets from own projects" ON public.assets
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.generations
      JOIN public.projects ON projects.id = generations.project_id
      WHERE generations.id = assets.generation_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_assets_generation_id ON public.assets(generation_id);
CREATE INDEX idx_assets_type ON public.assets(type);

