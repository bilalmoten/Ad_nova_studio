import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export async function uploadImage(
  projectId: string,
  imageBase64: string,
  filename: string
): Promise<string> {
  // Use service role client for storage uploads to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Convert base64 to buffer
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;
  const buffer = Buffer.from(base64Data, 'base64');

  // Upload to Supabase Storage
  const storagePath = `projects/${projectId}/images/${filename}`;
  const { error } = await supabase.storage
    .from('assets')
    .upload(storagePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }

  // Get signed URL (bucket is private with RLS)
  const signedUrlResult = await supabase.storage.from('assets').createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (!signedUrlResult.data?.signedUrl) {
    throw new Error('Failed to generate signed URL');
  }

  return signedUrlResult.data.signedUrl;
}

