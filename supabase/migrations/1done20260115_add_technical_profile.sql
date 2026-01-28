-- ============================================
-- Add technical_profile column to studio_concepts
-- For temporal coherence in AI video generation
-- ============================================

-- Add technical_profile column to store camera/lens/lighting/color grade specs
-- This ensures visual consistency across all generated shots
ALTER TABLE public.studio_concepts 
ADD COLUMN IF NOT EXISTS technical_profile TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.studio_concepts.technical_profile IS 
'Technical cinematography profile (camera, lens, lighting, color grade) for visual consistency across shots';
