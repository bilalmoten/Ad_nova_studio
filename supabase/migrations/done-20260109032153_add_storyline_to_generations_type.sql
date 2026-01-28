-- Update generations_type_check constraint to include 'storyline'
ALTER TABLE public.generations DROP CONSTRAINT IF EXISTS generations_type_check;

ALTER TABLE public.generations 
ADD CONSTRAINT generations_type_check 
CHECK (type IN ('concept', 'storyline', 'hero', 'storyboard', 'video', 'audio'));
