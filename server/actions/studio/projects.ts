'use server'

// server/actions/studio/projects.ts
// ============================================
// Studio Project CRUD Actions
// ============================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type {
    StudioProject,
    StudioProjectWithData,
    CreateStudioProjectInput,
    UpdateStudioProjectInput,
    WorkflowStep,
} from '@/lib/studio/types'
import { STUDIO_CONFIG } from '@/lib/studio/config'
import { GENERATION_SETTINGS } from '@/lib/studio/prompts'
import { getFreshSignedUrl } from '@/lib/storage'

/**
 * Create a new studio project
 */
export async function createStudioProject(data: CreateStudioProjectInput) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data: project, error } = await supabase
        .from('studio_projects')
        .insert({
            user_id: user.id,
            name: data.name || STUDIO_CONFIG.defaults.projectName,
            prompt: data.prompt,
            reference_image_url: data.reference_image_url || null,
            visual_style: data.visual_style || null,
            user_notes: data.user_notes || null,
            shot_count: data.shot_count || STUDIO_CONFIG.defaults.shotCount,
            aspect_ratio: data.aspect_ratio || STUDIO_CONFIG.defaults.aspectRatio,
            current_step: 'concept' as WorkflowStep,
            status: 'draft',
            estimated_credits:
                (data.shot_count || STUDIO_CONFIG.defaults.shotCount) *
                GENERATION_SETTINGS.video.creditsPerShot,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating project:', error)
        return { error: error.message }
    }

    revalidatePath('/dashboard2')
    return { data: project as StudioProject }
}

/**
 * Get a single studio project with all related data
 */
export async function getStudioProject(projectId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Get project
    const { data: project, error: projectError } = await supabase
        .from('studio_projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (projectError || !project) {
        return { error: 'Project not found' }
    }

    // Get concepts
    const { data: concepts } = await supabase
        .from('studio_concepts')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

    // Get shots with related data
    const { data: shots } = await supabase
        .from('studio_shots')
        .select('*')
        .eq('project_id', projectId)
        .order('order_index', { ascending: true })

    // Get frames
    const { data: frames } = await supabase
        .from('studio_frames')
        .select('*')
        .eq('project_id', projectId)

    // Get motion prompts
    const { data: motionPrompts } = await supabase
        .from('studio_motion_prompts')
        .select('*')
        .eq('project_id', projectId)

    // Get videos
    const { data: videos } = await supabase
        .from('studio_videos')
        .select('*')
        .eq('project_id', projectId)

    // Get hero images
    const { data: heroImages } = await supabase
        .from('studio_hero_images')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: true })

    // Helper to refresh signed URLs (they expire after 1 hour)
    const refreshUrl = async (url: string | null): Promise<string | null> => {
        if (!url) return null
        try {
            return await getFreshSignedUrl(url)
        } catch {
            return url // Fallback to original if refresh fails
        }
    }

    // Refresh frame URLs
    const refreshedFrames = await Promise.all(
        (frames || []).map(async (frame) => ({
            ...frame,
            url: await refreshUrl(frame.url),
        }))
    )

    // Refresh video URLs  
    const refreshedVideos = await Promise.all(
        (videos || []).map(async (video) => ({
            ...video,
            url: await refreshUrl(video.url),
            download_url: await refreshUrl(video.download_url),
        }))
    )

    // Refresh hero image URLs
    const refreshedHeroImages = await Promise.all(
        (heroImages || []).map(async (img) => ({
            ...img,
            url: await refreshUrl(img.url),
        }))
    )

    // Combine shots with their related data
    const shotsWithData = (shots || []).map((shot) => ({
        ...shot,
        start_frame: refreshedFrames.find(
            (f) => f.shot_id === shot.id && f.frame_type === 'start'
        ) || null,
        end_frame: refreshedFrames.find(
            (f) => f.shot_id === shot.id && f.frame_type === 'end'
        ) || null,
        motion_prompt: motionPrompts?.find((m) => m.shot_id === shot.id) || null,
        video: refreshedVideos.find((v) => v.shot_id === shot.id) || null,
    }))

    const projectWithData: StudioProjectWithData = {
        ...project,
        concepts: concepts || [],
        shots: shotsWithData,
        hero_images: refreshedHeroImages,
    }

    return { data: projectWithData }
}

/**
 * Get all projects for current user
 */
export async function getStudioProjects() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { data: projects, error } = await supabase
        .from('studio_projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

    if (error) {
        return { error: error.message }
    }

    return { data: projects as StudioProject[] }
}

/**
 * Update a studio project
 */
export async function updateStudioProject(
    projectId: string,
    updates: UpdateStudioProjectInput
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    // Recalculate credits if shot count changes
    const updateData: any = { ...updates }
    if (updates.shot_count) {
        updateData.estimated_credits =
            updates.shot_count * GENERATION_SETTINGS.video.creditsPerShot
    }

    const { data: project, error } = await supabase
        .from('studio_projects')
        .update(updateData)
        .eq('id', projectId)
        .select()
        .single()

    if (error) {
        return { error: error.message }
    }

    revalidatePath(`/dashboard2/studio/${projectId}`)
    return { data: project as StudioProject }
}

/**
 * Update project workflow step
 */
export async function updateWorkflowStep(
    projectId: string,
    step: WorkflowStep
) {
    return updateStudioProject(projectId, {
        current_step: step,
        status: step === 'editor' ? 'completed' : 'in-progress',
    })
}

/**
 * Delete a studio project
 */
export async function deleteStudioProject(projectId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized' }
    }

    const { error } = await supabase
        .from('studio_projects')
        .delete()
        .eq('id', projectId)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard2')
    return { success: true }
}
