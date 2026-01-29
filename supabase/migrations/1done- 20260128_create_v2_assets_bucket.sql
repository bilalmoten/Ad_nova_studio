-- Create v2_assets bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('v2_assets', 'v2_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'v2_assets' );

-- Policy: Allow authenticated uploads
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'v2_assets' );

-- Policy: Allow authenticated updates
CREATE POLICY "Authenticated Updates"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'v2_assets' );

-- Policy: Allow users to delete their own assets (optional, good for cleanup)
CREATE POLICY "User Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'v2_assets' AND owner = auth.uid() );
