-- Fix for studio_videos table to support upsert on shot_id
-- Run this in Supabase Dashboard > SQL Editor

-- Add unique constraint on shot_id (each shot can have only one video)
ALTER TABLE studio_videos 
ADD CONSTRAINT studio_videos_shot_id_key UNIQUE (shot_id);

-- Also add missing constraints for other tables if not present
-- (These may already exist, will error if they do - that's fine)

-- studio_motion_prompts: one prompt per shot
ALTER TABLE studio_motion_prompts 
ADD CONSTRAINT studio_motion_prompts_shot_id_key UNIQUE (shot_id);
