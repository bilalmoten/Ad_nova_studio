-- Make start/end frame descriptions nullable since they might not be available immediately
ALTER TABLE public.scenes 
ALTER COLUMN start_frame_desc DROP NOT NULL,
ALTER COLUMN end_frame_desc DROP NOT NULL;

-- Add generated_concepts to projects to persist the list of ideas
ALTER TABLE public.projects
ADD COLUMN IF NOT EXISTS generated_concepts JSONB;

COMMENT ON COLUMN public.projects.generated_concepts IS 'List of generated concept ideas for persistence';
