'use server'

// server/actions/studio/upload.ts
// ============================================
// File Upload Server Actions
// Uses service role to bypass RLS
// ============================================

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Upload an image to storage (server-side with service role)
 */
export async function uploadImageAction(
    projectId: string,
    imageBase64: string,
    filename: string
): Promise<{ url?: string; error?: string }> {
    try {
        // Use service role client for storage uploads to bypass RLS
        const supabase = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Convert base64 to buffer
        const base64Data = imageBase64.includes(',')
            ? imageBase64.split(',')[1]
            : imageBase64
        const buffer = Buffer.from(base64Data, 'base64')

        // Upload to Supabase Storage
        const storagePath = `projects/${projectId}/images/${filename}`
        const { error } = await supabase.storage
            .from('assets')
            .upload(storagePath, buffer, {
                contentType: 'image/png',
                upsert: true,
            })

        if (error) {
            return { error: `Failed to upload image: ${error.message}` }
        }

        // Get public URL or signed URL
        const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(storagePath)

        return { url: publicUrl }
    } catch (error) {
        return { error: error instanceof Error ? error.message : 'Upload failed' }
    }
}
