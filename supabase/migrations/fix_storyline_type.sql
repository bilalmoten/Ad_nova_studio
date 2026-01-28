-- Fix generations_type_check constraint to include 'storyline' type
-- This fixes the error: new row for relation "generations" violates check constraint "generations_type_check"

-- Drop the existing constraint
ALTER TABLE public.generations DROP CONSTRAINT IF EXISTS generations_type_check;

-- Add updated constraint with 'storyline' included
ALTER TABLE public.generations 
ADD CONSTRAINT generations_type_check 
CHECK (type IN ('concept', 'storyline', 'hero', 'storyboard', 'video', 'audio'));
