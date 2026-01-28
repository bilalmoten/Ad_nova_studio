'use server'

// server/actions/studio/storyline.ts
// ============================================
// Storyline Generation Actions
// Uses: Selected concept, reference images, shot count
// ============================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { studioAI, ImageInput } from '@/lib/ai/studio-client'
import { STORYLINE_PROMPTS, GENERATION_SETTINGS } from '@/lib/studio/prompts'
import type { StudioShot } from '@/lib/studio/types'

interface GenerateStorylineResult {
    data?: StudioShot[]
    error?: string
}

/**
 * Generate storyline (shots) for a project
 * Uses: selected concept, reference images, shot count
 */
export async function generateStoryline(
    projectId: string,
    userInstructions?: string
): Promise<GenerateStorylineResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get project with selected concept
        const { data: project, error: projectError } = await supabase
            .from('studio_projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single()

        if (projectError || !project) {
            return { error: 'Project not found' }
        }

        if (!project.selected_concept) {
            return { error: 'No concept selected. Please select a concept first.' }
        }

        // Prepare reference images if available
        const images: ImageInput[] = []
        if (project.reference_image_url) {
            try {
                const response = await fetch(project.reference_image_url)
                const arrayBuffer = await response.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                const mimeType = response.headers.get('content-type') || 'image/jpeg'

                images.push({
                    base64,
                    mimeType: mimeType as ImageInput['mimeType'],
                })
            } catch (err) {
                console.warn('Could not fetch reference image:', err)
            }
        }

        const concept = project.selected_concept

        // Build prompt
        const prompt = STORYLINE_PROMPTS.generate({
            concept: {
                name: concept.name,
                tagline: concept.tagline,
                description: concept.description,
                visualStyle: concept.visual_style || concept.visualStyle,
                pacing: concept.pacing,
                technicalProfile: concept.technical_profile || concept.technicalProfile,
            },
            shotCount: project.shot_count || 5,
            userInstructions,
            hasReferenceImages: images.length > 0,
        })

        // Generate using AI
        const result = await studioAI.generateText<{ shots: any[] }>({
            prompt,
            systemPrompt: STORYLINE_PROMPTS.system,
            images: images.length > 0 ? images : undefined,
            responseSchema: STORYLINE_PROMPTS.schema,
            temperature: GENERATION_SETTINGS.storyline.temperature,
        })

        if (!result.success || !result.data?.shots) {
            return { error: result.error || 'Failed to generate storyline' }
        }

        // Clear existing shots
        await supabase
            .from('studio_shots')
            .delete()
            .eq('project_id', projectId)

        // Insert new shots - schema: order_index, title, description, voiceover_action
        const shotsToInsert = result.data.shots.map((shot: any, index: number) => ({
            project_id: projectId,
            order_index: index + 1,
            title: shot.title || `Shot ${index + 1}`,
            description: shot.description,
            voiceover_action: shot.voiceoverAction || null,
        }))

        console.log('Inserting shots:', JSON.stringify(shotsToInsert, null, 2))

        const { data: insertedShots, error: insertError } = await supabase
            .from('studio_shots')
            .insert(shotsToInsert)
            .select()

        if (insertError) {
            console.error('Failed to save shots:', insertError)
            return { error: `Failed to save shots: ${insertError.message}` }
        }

        // Log generation - schema has: generation_type, model_used, prompt_used, status, result_summary
        await supabase.from('studio_generation_log').insert({
            project_id: projectId,
            generation_type: 'storyline',
            model_used: result.model,
            prompt_used: prompt,
            result_summary: `Generated ${result.data.shots.length} shots`,
            status: 'completed',
        }).then(({ error }) => {
            if (error) console.error('Failed to log generation:', error)
        })

        revalidatePath(`/dashboard2/studio/${projectId}`)

        return { data: insertedShots }
    } catch (error) {
        console.error('Error generating storyline:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Get shots for a project
 */
export async function getShots(projectId: string): Promise<{
    data?: StudioShot[]
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('studio_shots')
            .select('*')
            .eq('project_id', projectId)
            .order('order_index')

        if (error) {
            return { error: 'Failed to fetch shots' }
        }

        return { data }
    } catch (error) {
        return { error: 'Internal server error' }
    }
}

/**
 * Update a shot
 */
export async function updateShot(
    shotId: string,
    updates: Partial<Pick<StudioShot, 'title' | 'description' | 'voiceover_action'>>
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        const { error } = await supabase
            .from('studio_shots')
            .update({
                ...updates,
                updated_at: new Date().toISOString(),
            })
            .eq('id', shotId)

        if (error) {
            return { error: 'Failed to update shot' }
        }

        return {}
    } catch (error) {
        return { error: 'Internal server error' }
    }
}

/**
 * Delete a shot
 */
export async function deleteShot(shotId: string): Promise<{ error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get shot to find project
        const { data: shot } = await supabase
            .from('studio_shots')
            .select('project_id')
            .eq('id', shotId)
            .single()

        const { error } = await supabase
            .from('studio_shots')
            .delete()
            .eq('id', shotId)

        if (error) {
            return { error: 'Failed to delete shot' }
        }

        if (shot) {
            revalidatePath(`/dashboard2/studio/${shot.project_id}`)
        }

        return {}
    } catch (error) {
        return { error: 'Internal server error' }
    }
}

/**
 * Reorder shots
 */
export async function reorderShots(
    projectId: string,
    shotIds: string[]
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Update order for each shot
        for (let i = 0; i < shotIds.length; i++) {
            await supabase
                .from('studio_shots')
                .update({ order_index: i + 1 })
                .eq('id', shotIds[i])
        }

        revalidatePath(`/dashboard2/studio/${projectId}`)

        return {}
    } catch (error) {
        return { error: 'Internal server error' }
    }
}
