-- Drop existing constraints if they exist (to be safe)
ALTER TABLE public.generations DROP CONSTRAINT IF EXISTS generations_type_check;
ALTER TABLE public.generations DROP CONSTRAINT IF EXISTS generations_status_check;

-- Add correct constraints
ALTER TABLE public.generations 
ADD CONSTRAINT generations_type_check 
CHECK (type IN ('concept', 'hero', 'storyboard', 'video', 'audio'));

ALTER TABLE public.generations 
ADD CONSTRAINT generations_status_check 
CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
