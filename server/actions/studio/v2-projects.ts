'use server'

// server/actions/studio/v2-projects.ts
// ============================================
// Server Actions for V2 Projects
// ============================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
    V2Project,
    CreateV2ProjectInput,
    UpdateV2ProjectInput,
} from '@/lib/studio/v2-types'

/**
 * Create a new V2 project
 */
export async function createV2Project(
    input: CreateV2ProjectInput = {}
): Promise<{ data: V2Project | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { data: null, error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('v2_projects')
            .insert({
                user_id: user.id,
                name: input.name || 'Untitled Project',
                description: input.description || null,
                settings: input.settings || {},
                anchors: input.anchors || [],
            })
            .select()
            .single()

        if (error) {
            console.error('Error creating V2 project:', error)
            return { data: null, error: error.message }
        }

        revalidatePath('/dashboard2/studio-new')
        return { data: data as V2Project, error: null }
    } catch (err) {
        console.error('Unexpected error creating V2 project:', err)
        return { data: null, error: 'Failed to create project' }
    }
}

/**
 * Get a V2 project by ID
 */
export async function getV2Project(
    projectId: string
): Promise<{ data: V2Project | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { data: null, error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('v2_projects')
            .select('*')
            .eq('id', projectId)
            .single()

        if (error) {
            console.error('Error fetching V2 project:', error)
            return { data: null, error: error.message }
        }

        return { data: data as V2Project, error: null }
    } catch (err) {
        console.error('Unexpected error fetching V2 project:', err)
        return { data: null, error: 'Failed to fetch project' }
    }
}

/**
 * Get all V2 projects for current user
 */
export async function getV2Projects(): Promise<{ data: V2Project[]; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { data: [], error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('v2_projects')
            .select('*')
            .order('updated_at', { ascending: false })

        if (error) {
            console.error('Error fetching V2 projects:', error)
            return { data: [], error: error.message }
        }

        return { data: (data as V2Project[]) || [], error: null }
    } catch (err) {
        console.error('Unexpected error fetching V2 projects:', err)
        return { data: [], error: 'Failed to fetch projects' }
    }
}

/**
 * Update a V2 project
 */
export async function updateV2Project(
    projectId: string,
    input: UpdateV2ProjectInput
): Promise<{ data: V2Project | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { data: null, error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('v2_projects')
            .update({
                ...input,
                updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)
            .select()
            .single()

        if (error) {
            console.error('Error updating V2 project:', error)
            return { data: null, error: error.message }
        }

        revalidatePath('/dashboard2/studio-new')
        return { data: data as V2Project, error: null }
    } catch (err) {
        console.error('Unexpected error updating V2 project:', err)
        return { data: null, error: 'Failed to update project' }
    }
}

/**
 * Delete a V2 project
 */
export async function deleteV2Project(
    projectId: string
): Promise<{ success: boolean; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { success: false, error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('v2_projects')
            .delete()
            .eq('id', projectId)

        if (error) {
            console.error('Error deleting V2 project:', error)
            return { success: false, error: error.message }
        }

        revalidatePath('/dashboard2/studio-new')
        return { success: true, error: null }
    } catch (err) {
        console.error('Unexpected error deleting V2 project:', err)
        return { success: false, error: 'Failed to delete project' }
    }
}

/**
 * Add an anchor to a project
 */
export async function addV2ProjectAnchor(
    projectId: string,
    anchor: V2Project['anchors'][0]
): Promise<{ data: V2Project | null; error: string | null }> {
    try {
        const supabase = await createClient()

        // Get current project
        const { data: project, error: fetchError } = await supabase
            .from('v2_projects')
            .select('anchors')
            .eq('id', projectId)
            .single()

        if (fetchError) {
            return { data: null, error: fetchError.message }
        }

        const currentAnchors = (project?.anchors as V2Project['anchors']) || []
        const updatedAnchors = [...currentAnchors, { ...anchor, id: crypto.randomUUID() }]

        return updateV2Project(projectId, { anchors: updatedAnchors })
    } catch (err) {
        console.error('Error adding anchor:', err)
        return { data: null, error: 'Failed to add anchor' }
    }
}

/**
 * Remove an anchor from a project
 */
export async function removeV2ProjectAnchor(
    projectId: string,
    anchorId: string
): Promise<{ data: V2Project | null; error: string | null }> {
    try {
        const supabase = await createClient()

        const { data: project, error: fetchError } = await supabase
            .from('v2_projects')
            .select('anchors')
            .eq('id', projectId)
            .single()

        if (fetchError) {
            return { data: null, error: fetchError.message }
        }

        const currentAnchors = (project?.anchors as V2Project['anchors']) || []
        const updatedAnchors = currentAnchors.filter(a => a.id !== anchorId)

        return updateV2Project(projectId, { anchors: updatedAnchors })
    } catch (err) {
        console.error('Error removing anchor:', err)
        return { data: null, error: 'Failed to remove anchor' }
    }
}
