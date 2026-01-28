-- Enable RLS on storage.objects (if not already enabled)
-- Note: This assumes the 'assets' bucket exists

-- Allow users to view objects in their project folders
CREATE POLICY "Users can view objects in their project folders" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'assets' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE user_id = auth.uid()
      AND id::text = (string_to_array(name, '/'))[2]
    )
  );

-- Allow users to upload objects to their project folders
CREATE POLICY "Users can upload objects to their project folders" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'assets' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE user_id = auth.uid()
      AND id::text = (string_to_array(name, '/'))[2]
    )
  );

-- Allow users to update objects in their project folders
CREATE POLICY "Users can update objects in their project folders" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'assets' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE user_id = auth.uid()
      AND id::text = (string_to_array(name, '/'))[2]
    )
  );

-- Allow users to delete objects in their project folders
CREATE POLICY "Users can delete objects in their project folders" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'assets' AND
    EXISTS (
      SELECT 1 FROM projects
      WHERE user_id = auth.uid()
      AND id::text = (string_to_array(name, '/'))[2]
    )
  );