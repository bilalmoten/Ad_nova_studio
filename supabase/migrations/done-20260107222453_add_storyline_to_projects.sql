-- Add storyline column to projects table
ALTER TABLE public.projects ADD COLUMN storyline JSONB;

-- Create index for storyline queries
CREATE INDEX idx_projects_storyline ON public.projects USING GIN (storyline);
