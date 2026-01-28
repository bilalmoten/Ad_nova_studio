-- Add start/end frame URL columns to scenes table
ALTER TABLE scenes
ADD COLUMN IF NOT EXISTS start_frame_url TEXT,
ADD COLUMN IF NOT EXISTS end_frame_url TEXT;

COMMENT ON COLUMN scenes.start_frame_url IS 'URL of the generated start frame image';
COMMENT ON COLUMN scenes.end_frame_url IS 'URL of the generated end frame image';
