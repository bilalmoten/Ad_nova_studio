import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Extract storage path from a Supabase signed URL
 * Signed URLs look like: https://xxx.supabase.co/storage/v1/object/sign/assets/projects/xxx/images/xxx.png?token=...
 */
export function extractStoragePathFromUrl(signedUrl: string): string | null {
    try {
        // Handle both signed URLs and public URLs
        const url = new URL(signedUrl);
        const pathname = url.pathname;

        // Pattern: /storage/v1/object/sign/assets/... or /storage/v1/object/public/assets/...
        const match = pathname.match(/\/storage\/v1\/object\/(sign|public)\/assets\/(.+)/);
        if (match) {
            return match[2]; // Return the path after 'assets/'
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Get a fresh signed URL for a Supabase storage path
 * Handles both storage paths and existing signed URLs (extracts path and re-signs)
 */
export async function getFreshSignedUrl(
    urlOrPath: string,
    expiresIn: number = 3600
): Promise<string> {
    // Use service role client for storage to bypass RLS
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    let storagePath: string;

    // Check if this is already a URL (has protocol)
    if (urlOrPath.startsWith('http')) {
        const extracted = extractStoragePathFromUrl(urlOrPath);
        if (!extracted) {
            throw new Error(`Could not extract storage path from URL: ${urlOrPath}`);
        }
        storagePath = extracted;
    } else {
        // It's already a path
        storagePath = urlOrPath;
    }

    const { data, error } = await supabase.storage
        .from('assets')
        .createSignedUrl(storagePath, expiresIn);

    if (error || !data?.signedUrl) {
        throw new Error(`Failed to create signed URL: ${error?.message || 'Unknown error'}`);
    }

    return data.signedUrl;
}
