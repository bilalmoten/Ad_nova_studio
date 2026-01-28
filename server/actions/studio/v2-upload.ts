'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Upload a temporary reference image
 */
export async function uploadTempImage(formData: FormData): Promise<{ url?: string; error?: string }> {
    try {
        const file = formData.get('file') as File
        if (!file) return { error: 'No file provided' }

        const supabase = await createClient()

        // Auth check
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) return { error: 'Unauthorized' }

        // Upload to v2_assets bucket (or temp)
        const filename = `temp/ref_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`

        const { data, error } = await supabase
            .storage
            .from('v2_assets')
            .upload(filename, file, {
                upsert: true,
            })

        if (error) {
            console.error('Upload error:', error)
            return { error: 'Upload failed' }
        }

        // Get public URL
        const { data: { publicUrl } } = supabase
            .storage
            .from('v2_assets')
            .getPublicUrl(filename)

        return { url: publicUrl }

    } catch (error) {
        console.error('Server upload error:', error)
        return { error: 'Internal server error' }
    }
}
