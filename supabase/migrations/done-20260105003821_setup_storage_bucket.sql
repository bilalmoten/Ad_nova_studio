-- Create storage bucket for assets
-- Note: This requires Supabase Storage to be enabled
-- The bucket will be created via Supabase Dashboard or CLI
-- This migration documents the bucket structure

-- Bucket name: assets
-- Public: false (use signed URLs)
-- Allowed MIME types: image/*, video/*, audio/*

-- Storage policies will be handled by RLS on the assets table
-- Users can only access assets from their own projects

