import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Upload video to Supabase Storage
 * Accepts either a base64 string or a URL to download
 */
export async function uploadVideo(
  projectId: string,
  videoData: string, // base64 or URL
  filename: string
): Promise<string> {
  // Use service role client for storage uploads to bypass RLS
  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  let buffer: Buffer;

  // Check if it's a URL (from Veo API) or base64
  if (videoData.startsWith('http')) {
    // Download video from URL
    const response = await fetch(videoData);
    const arrayBuffer = await response.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);
  } else {
    // Treat as base64
    const base64Data = videoData.includes(',')
      ? videoData.split(',')[1]
      : videoData;
    buffer = Buffer.from(base64Data, 'base64');
  }

  // Upload to Supabase Storage
  const storagePath = `projects/${projectId}/videos/${filename}`;
  const { data, error } = await supabase.storage
    .from('assets')
    .upload(storagePath, buffer, {
      contentType: 'video/mp4',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to upload video: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from('assets').getPublicUrl(storagePath);

  return publicUrl;
}
