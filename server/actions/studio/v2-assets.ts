'use server'

// server/actions/studio/v2-assets.ts
// ============================================
// Server Actions for V2 Assets
// ============================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
    V2Asset,
    V2AssetType,
    V2AssetStatus,
    CreateV2AssetInput,
    UpdateV2AssetInput,
} from '@/lib/studio/v2-types'

/**
 * Create a new V2 asset
 */
export async function createV2Asset(
    input: CreateV2AssetInput
): Promise<{ data: V2Asset | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { data: null, error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('v2_assets')
            .insert({
                project_id: input.project_id,
                type: input.type,
                content: input.content || null,
                media_url: input.media_url || null,
                parent_id: input.parent_id || null,
                metadata: input.metadata || {},
                is_temporary: input.is_temporary ?? true,
                status: 'ready',
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating V2 asset:', error)
            return { data: null, error: error.message }
        }

        revalidatePath('/dashboard2/studio-new')
        return { data: data as V2Asset, error: null }
    } catch (err) {
        console.error('Unexpected error creating V2 asset:', err)
        return { data: null, error: 'Failed to create asset' }
    }
}

/**
 * Get assets for a project with optional filters
 */
export async function getV2Assets(
    projectId: string,
    filters?: {
        type?: V2AssetType
        status?: V2AssetStatus
        is_favorite?: boolean
        is_archived?: boolean
        limit?: number
    }
): Promise<{ data: V2Asset[]; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { data: [], error: 'Unauthorized' }
        }

        let query = supabase
            .from('v2_assets')
            .select('*')
            .eq('project_id', projectId)
            .eq('is_archived', filters?.is_archived ?? false)
            .order('created_at', { ascending: false })

        if (filters?.type) {
            query = query.eq('type', filters.type)
        }
        if (filters?.status) {
            query = query.eq('status', filters.status)
        }
        if (filters?.is_favorite !== undefined) {
            query = query.eq('is_favorite', filters.is_favorite)
        }
        if (filters?.limit) {
            query = query.limit(filters.limit)
        }

        const { data, error } = await query

        if (error) {
            console.error('Error fetching V2 assets:', error)
            return { data: [], error: error.message }
        }

        return { data: (data as V2Asset[]) || [], error: null }
    } catch (err) {
        console.error('Unexpected error fetching V2 assets:', err)
        return { data: [], error: 'Failed to fetch assets' }
    }
}

/**
 * Get a single asset by ID
 */
export async function getV2Asset(
    assetId: string
): Promise<{ data: V2Asset | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('v2_assets')
            .select('*')
            .eq('id', assetId)
            .single()

        if (error) {
            console.error('Error fetching V2 asset:', error)
            return { data: null, error: error.message }
        }

        return { data: data as V2Asset, error: null }
    } catch (err) {
        console.error('Unexpected error fetching V2 asset:', err)
        return { data: null, error: 'Failed to fetch asset' }
    }
}

/**
 * Update a V2 asset
 */
export async function updateV2Asset(
    assetId: string,
    input: UpdateV2AssetInput
): Promise<{ data: V2Asset | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('v2_assets')
            .update({
                ...input,
                updated_at: new Date().toISOString(),
            })
            .eq('id', assetId)
            .select()
            .single()

        if (error) {
            console.error('Error updating V2 asset:', error)
            return { data: null, error: error.message }
        }

        revalidatePath('/dashboard2/studio-new')
        return { data: data as V2Asset, error: null }
    } catch (err) {
        console.error('Unexpected error updating V2 asset:', err)
        return { data: null, error: 'Failed to update asset' }
    }
}

/**
 * Toggle favorite status (marks as Final per design brief)
 */
export async function toggleV2AssetFavorite(
    assetId: string
): Promise<{ data: V2Asset | null; error: string | null }> {
    try {
        const supabase = await createClient()

        // Get current status
        const { data: asset, error: fetchError } = await supabase
            .from('v2_assets')
            .select('is_favorite')
            .eq('id', assetId)
            .single()

        if (fetchError) {
            return { data: null, error: fetchError.message }
        }

        // Toggle
        return updateV2Asset(assetId, {
            is_favorite: !asset.is_favorite,
            is_temporary: false, // Favorited assets are never temporary
        })
    } catch (err) {
        console.error('Error toggling favorite:', err)
        return { data: null, error: 'Failed to toggle favorite' }
    }
}

/**
 * Archive an asset (soft delete)
 */
export async function archiveV2Asset(
    assetId: string
): Promise<{ data: V2Asset | null; error: string | null }> {
    return updateV2Asset(assetId, { is_archived: true })
}

/**
 * Restore an archived asset
 */
export async function restoreV2Asset(
    assetId: string
): Promise<{ data: V2Asset | null; error: string | null }> {
    return updateV2Asset(assetId, { is_archived: false })
}

/**
 * Permanently delete an asset
 */
export async function deleteV2Asset(
    assetId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient()

        const { error } = await supabase
            .from('v2_assets')
            .delete()
            .eq('id', assetId)

        if (error) {
            console.error('Error deleting V2 asset:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/dashboard2/studio-new')
        return { success: true, error: null }
    } catch (err) {
        console.error('Unexpected error deleting V2 asset:', err)
        return { success: false, error: 'Failed to delete asset' }
    }
}

/**
 * Get asset lineage (parent chain)
 */
export async function getV2AssetLineage(
    assetId: string
): Promise<{ data: V2Asset[]; error: string | null }> {
    try {
        const supabase = await createClient()
        const lineage: V2Asset[] = []
        let currentId: string | null = assetId
        let iterations = 0

        // Walk up the parent chain (max 10 levels to prevent infinite loops)
        while (currentId && iterations < 10) {
            const result = await supabase
                .from('v2_assets')
                .select('*')
                .eq('id', currentId)
                .single()

            if (result.error || !result.data) break

            const asset = result.data as V2Asset
            lineage.push(asset)
            currentId = asset.parent_id
            iterations++
        }

        return { data: lineage, error: null }
    } catch (err) {
        console.error('Error fetching lineage:', err)
        return { data: [], error: 'Failed to fetch lineage' }
    }
}

/**
 * Get child assets (variations)
 */
export async function getV2AssetChildren(
    assetId: string
): Promise<{ data: V2Asset[]; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('v2_assets')
            .select('*')
            .eq('parent_id', assetId)
            .order('created_at', { ascending: false })

        if (error) {
            return { data: [], error: error.message }
        }

        return { data: (data as V2Asset[]) || [], error: null }
    } catch (err) {
        console.error('Error fetching children:', err)
        return { data: [], error: 'Failed to fetch children' }
    }
}

/**
 * Save asset (mark as non-temporary)
 */
export async function saveV2Asset(
    assetId: string
): Promise<{ data: V2Asset | null; error: string | null }> {
    return updateV2Asset(assetId, { is_temporary: false })
}

/**
 * Extract images from a grid/batch asset
 * This creates individual asset records for each image in a batch,
 * allowing users to work with them individually.
 * 
 * For now, since we don't actually have a grid image to split,
 * this creates N copies of the parent asset as children.
 * In a real implementation, you would use image processing to
 * detect and extract individual images from a grid.
 */
export async function extractGridImages(
    parentAssetId: string,
    count: number // Number of images to extract (user specifies based on what they see)
): Promise<{ data: V2Asset[]; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { data: [], error: 'Unauthorized' }
        }

        // Get parent asset
        const { data: parentAsset, error: fetchError } = await supabase
            .from('v2_assets')
            .select('*')
            .eq('id', parentAssetId)
            .single()

        if (fetchError || !parentAsset) {
            return { data: [], error: 'Parent asset not found' }
        }

        // Create child assets - each one references the parent and the same image
        // In a real implementation, you'd crop/extract specific regions
        const childAssets: V2Asset[] = []

        for (let i = 0; i < count; i++) {
            const { data: child, error: insertError } = await supabase
                .from('v2_assets')
                .insert({
                    project_id: parentAsset.project_id,
                    type: parentAsset.type,
                    media_url: parentAsset.media_url, // Same image for now
                    parent_id: parentAssetId,
                    metadata: {
                        ...(parentAsset.metadata || {}),
                        extracted_from_grid: true,
                        grid_position: i + 1,
                        original_prompt: (parentAsset.metadata as any)?.prompt || '',
                    },
                    is_temporary: false,
                    status: 'ready',
                })
                .select()
                .single()

            if (insertError) {
                console.error(`Error creating extracted asset ${i}:`, insertError)
            } else if (child) {
                childAssets.push(child as V2Asset)
            }
        }

        // Mark parent as having been extracted
        await supabase
            .from('v2_assets')
            .update({
                metadata: {
                    ...(parentAsset.metadata || {}),
                    grid_extracted: true,
                    extracted_count: count
                }
            })
            .eq('id', parentAssetId)

        revalidatePath('/dashboard2/studio-new')
        return { data: childAssets, error: null }
    } catch (err) {
        console.error('Error extracting grid images:', err)
        return { data: [], error: 'Failed to extract images' }
    }
}
