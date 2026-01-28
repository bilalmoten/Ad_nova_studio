-- Create generations table
CREATE TABLE public.generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('concept', 'hero', 'storyboard', 'video', 'audio')),
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  model_used TEXT,
  prompt TEXT,
  result_data JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- Create policies - Users can only access generations from their own projects
CREATE POLICY "Users can view generations from own projects" ON public.generations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = generations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert generations to own projects" ON public.generations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = generations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update generations in own projects" ON public.generations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = generations.project_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete generations from own projects" ON public.generations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = generations.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create indexes
CREATE INDEX idx_generations_project_id ON public.generations(project_id);
CREATE INDEX idx_generations_scene_id ON public.generations(scene_id);
CREATE INDEX idx_generations_status ON public.generations(status);
CREATE INDEX idx_generations_type ON public.generations(type);

