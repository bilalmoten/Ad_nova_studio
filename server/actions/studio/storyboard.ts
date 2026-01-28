'use server'

// server/actions/studio/storyboard.ts
// ============================================
// Storyboard Generation Actions
// KEY FEATURE: AI determines which hero images to use per shot
// Uses: Hero images as visual references, reference images
// ============================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { studioAI, ImageInput } from '@/lib/ai/studio-client'
import {
    STORYBOARD_ASSIGNMENT_PROMPTS,
    STORYBOARD_FRAME_PROMPTS,
    MOTION_PROMPTS,
    GENERATION_SETTINGS,
} from '@/lib/studio/prompts'
import { uploadImage } from '@/lib/storage'
import type { StudioShotWithData } from '@/lib/studio/types'

interface StoryboardAssignment {
    shotIndex: number
    framePrompt: string
    heroImageIds: string[]
    useReferenceImages: boolean
}

/**
 * Generate storyboard frames for all shots
 * 1. First, AI determines which images to use per shot
 * 2. Then, frames are generated with those images as references
 */
export async function generateStoryboardFrames(
    projectId: string
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get project with all related data
        const { data: project, error: projectError } = await supabase
            .from('studio_projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single()

        if (projectError || !project) {
            return { error: 'Project not found' }
        }

        // Get shots
        const { data: shots, error: shotsError } = await supabase
            .from('studio_shots')
            .select('*')
            .eq('project_id', projectId)
            .order('order_index')

        if (shotsError || !shots?.length) {
            return { error: 'No shots found. Generate storyline first.' }
        }

        // Get selected hero images (required)
        const { data: heroImages, error: heroError } = await supabase
            .from('studio_hero_images')
            .select('*')
            .eq('project_id', projectId)
            .eq('is_selected', true)

        if (heroError || !heroImages?.length) {
            return { error: 'No hero images selected. Select hero images first.' }
        }

        // Prepare reference image if exists
        let referenceImage: ImageInput | null = null
        if (project.reference_image_url) {
            try {
                const response = await fetch(project.reference_image_url)
                const arrayBuffer = await response.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                const mimeType = response.headers.get('content-type') || 'image/jpeg'
                referenceImage = { base64, mimeType: mimeType as ImageInput['mimeType'] }
            } catch (err) {
                console.warn('Could not fetch reference image:', err)
            }
        }

        // STEP 1: AI determines which images to use per shot
        const assignmentPrompt = STORYBOARD_ASSIGNMENT_PROMPTS.generate({
            shots: shots.map((s) => ({
                orderIndex: s.order_index,
                title: s.title,
                description: s.description,
            })),
            heroImages: heroImages.map((img) => ({
                id: img.id,
                label: img.label || 'Unlabeled',
                prompt: img.prompt,
            })),
            concept: {
                visualStyle: project.selected_concept?.visual_style || 'cinematic',
            },
            hasReferenceImages: !!referenceImage,
        })

        const assignmentResult = await studioAI.generateText<{ assignments: StoryboardAssignment[] }>({
            prompt: assignmentPrompt,
            systemPrompt: STORYBOARD_ASSIGNMENT_PROMPTS.system,
            responseSchema: STORYBOARD_ASSIGNMENT_PROMPTS.schema,
            temperature: GENERATION_SETTINGS.storyboard.temperature,
        })

        if (!assignmentResult.success || !assignmentResult.data?.assignments) {
            return { error: 'Failed to plan storyboard assignments' }
        }

        // Prepare hero image lookup (fetch all as base64)
        const heroImageData: Map<string, ImageInput> = new Map()
        for (const img of heroImages) {
            try {
                const response = await fetch(img.url)
                const arrayBuffer = await response.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                const mimeType = response.headers.get('content-type') || 'image/png'
                heroImageData.set(img.id, { base64, mimeType: mimeType as ImageInput['mimeType'] })
            } catch (err) {
                console.warn(`Could not fetch hero image ${img.id}:`, err)
            }
        }

        // STEP 2: Generate frames for each shot using assigned images
        // Track context for temporal coherence
        console.log(`Starting frame generation for ${shots.length} shots...`)

        const technicalProfile = project.selected_concept?.technical_profile ||
            project.selected_concept?.technicalProfile ||
            'Professional cinematic lighting'

        let previousShotContext: string | undefined
        let previousShotMotion: string | undefined
        let previousShotTitle: string | undefined

        for (const shot of shots) {
            try {
                console.log(`Processing shot ${shot.order_index}: ${shot.title}`)

                const assignment = assignmentResult.data.assignments.find(
                    (a) => a.shotIndex === shot.order_index
                )

                if (!assignment) {
                    console.warn(`No assignment found for shot ${shot.order_index}, creating default...`)
                    // Create a default assignment if AI didn't provide one
                }

                // Collect reference images for this shot
                const shotReferenceImages: ImageInput[] = []

                // Add assigned hero images (if assignment exists)
                if (assignment?.heroImageIds?.length) {
                    for (const heroId of assignment.heroImageIds) {
                        const imgData = heroImageData.get(heroId)
                        if (imgData) {
                            shotReferenceImages.push(imgData)
                        }
                    }
                }

                // Add user's reference image if applicable
                if (assignment?.useReferenceImages && referenceImage) {
                    shotReferenceImages.push(referenceImage)
                }

                // Generate start frame prompt with technical profile and previous shot context
                const framePrompt = STORYBOARD_FRAME_PROMPTS.startFrame({
                    shotTitle: shot.title,
                    shotDescription: shot.description,
                    conceptVisualStyle: project.selected_concept?.visual_style || 'cinematic',
                    technicalProfile,
                    framePrompt: assignment?.framePrompt || shot.description,
                    previousShotContext,
                })

                console.log(`Generating start frame for shot ${shot.order_index}...`)

                // Generate frame image
                const frameResult = await studioAI.generateImage({
                    prompt: framePrompt,
                    referenceImages: shotReferenceImages.length > 0 ? shotReferenceImages : undefined,
                    aspectRatio: (project.aspect_ratio as any) || '16:9',
                    numberOfImages: 1,
                })

                if (frameResult.success && frameResult.data?.images.length) {
                    // Upload frame
                    const filename = `frame_${shot.id}_start_${Date.now()}.png`
                    const url = await uploadImage(projectId, frameResult.data.images[0].base64, filename)
                    console.log(`Uploaded start frame for shot ${shot.order_index}: ${url}`)

                    // Save frame to database - use upsert to handle regeneration
                    const { error: frameInsertError } = await supabase.from('studio_frames').upsert({
                        shot_id: shot.id,
                        project_id: projectId,
                        frame_type: 'start',
                        url,
                        prompt: assignment?.framePrompt || shot.description,
                        status: 'completed',
                    }, {
                        onConflict: 'shot_id,frame_type',
                    })

                    if (frameInsertError) {
                        console.error(`Failed to upsert frame for shot ${shot.order_index}:`, frameInsertError)
                    }
                } else {
                    console.error(`Frame generation failed for shot ${shot.order_index}:`, frameResult.error)
                }

                // Generate motion prompt with previous shot context for flow continuity
                console.log(`Generating motion prompt for shot ${shot.order_index}...`)

                const motionResult = await studioAI.generateText<{
                    motionPrompt: string
                    cameraMovementType?: string
                    transitionSuggestion?: string
                }>({
                    prompt: MOTION_PROMPTS.generate({
                        shotTitle: shot.title,
                        shotDescription: shot.description,
                        voiceoverAction: shot.voiceover_action || undefined,
                        conceptVisualStyle: project.selected_concept?.visual_style || 'cinematic',
                        duration: 5,
                        previousShotMotion,
                        previousShotTitle,
                    }),
                    systemPrompt: MOTION_PROMPTS.system,
                    responseSchema: MOTION_PROMPTS.schema,
                    temperature: GENERATION_SETTINGS.motionPrompts.temperature,
                })

                if (motionResult.success && motionResult.data?.motionPrompt) {
                    // Use upsert since shot_id has UNIQUE constraint
                    const { error: motionInsertError } = await supabase
                        .from('studio_motion_prompts')
                        .upsert({
                            shot_id: shot.id,
                            project_id: projectId,
                            prompt: motionResult.data.motionPrompt,
                        }, {
                            onConflict: 'shot_id',
                        })

                    if (motionInsertError) {
                        console.error(`Failed to upsert motion prompt for shot ${shot.order_index}:`, motionInsertError)
                    } else {
                        console.log(`Motion prompt saved for shot ${shot.order_index}`)
                    }

                    // Update context for next shot
                    previousShotMotion = motionResult.data.motionPrompt
                } else {
                    console.error(`Motion prompt generation failed for shot ${shot.order_index}:`, motionResult.error)
                }

                // Update previous shot context for next iteration
                previousShotContext = `${shot.title}: ${shot.description}`
                previousShotTitle = shot.title

            } catch (shotError) {
                // Log error but continue to next shot
                console.error(`Error processing shot ${shot.order_index}:`, shotError)
                // Still update context so next shot can reference this one
                previousShotContext = `${shot.title}: ${shot.description}`
                previousShotTitle = shot.title
                // Continue to next shot instead of failing entire function
            }
        }

        console.log('Storyboard generation completed!')

        // Log generation - valid types: concept, storyline, hero_image, storyboard_frame, motion_prompt, video
        await supabase.from('studio_generation_log').insert({
            project_id: projectId,
            generation_type: 'storyboard_frame', // Valid enum value
            model_used: GENERATION_SETTINGS.storyboard.frameModel || 'gemini-3-pro-image-preview',
            prompt_used: 'Multiple frame prompts generated',
            result_summary: `Generated frames for ${shots.length} shots`,
            status: 'completed',
        }).then(({ error }) => {
            if (error) console.error('Failed to log storyboard generation:', error)
        })

        revalidatePath(`/dashboard2/studio/${projectId}`)

        return {}
    } catch (error) {
        console.error('Error generating storyboard:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Get storyboard data for a project
 */
export async function getStoryboardData(projectId: string): Promise<{
    data?: StudioShotWithData[]
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get shots with frames and motion prompts
        const { data: shots, error: shotsError } = await supabase
            .from('studio_shots')
            .select(`
        *,
        start_frame:studio_frames!inner(*)
      `)
            .eq('project_id', projectId)
            .eq('studio_frames.frame_type', 'start') // Column is frame_type
            .order('order_index')

        if (shotsError) {
            // Try without join if no frames yet
            const { data: basicShots } = await supabase
                .from('studio_shots')
                .select('*')
                .eq('project_id', projectId)
                .order('order_index')

            return { data: basicShots?.map((s) => ({ ...s, start_frame: null, end_frame: null, motion_prompt: null, video: null })) || [] }
        }

        return { data: shots as any }
    } catch (error) {
        return { error: 'Internal server error' }
    }
}

/**
 * Regenerate a specific frame
 */
export async function regenerateFrame(
    frameId: string,
    newInstructions?: string
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get frame with shot and project context
        const { data: frame, error: frameError } = await supabase
            .from('studio_frames')
            .select(`
        *,
        studio_shots!inner(*, studio_projects!inner(*))
      `)
            .eq('id', frameId)
            .single()

        if (frameError || !frame) {
            return { error: 'Frame not found' }
        }

        const shot = (frame as any).studio_shots
        const project = shot.studio_projects

        // Get hero images used for this frame
        const heroImageIds = frame.hero_images_used || []
        const referenceImages: ImageInput[] = []

        if (heroImageIds.length) {
            const { data: heroImages } = await supabase
                .from('studio_hero_images')
                .select('*')
                .in('id', heroImageIds)

            for (const img of heroImages || []) {
                try {
                    const response = await fetch(img.url)
                    const arrayBuffer = await response.arrayBuffer()
                    const base64 = Buffer.from(arrayBuffer).toString('base64')
                    const mimeType = response.headers.get('content-type') || 'image/png'
                    referenceImages.push({ base64, mimeType: mimeType as ImageInput['mimeType'] })
                } catch (err) {
                    console.warn('Could not fetch hero image:', err)
                }
            }
        }

        // Build new prompt
        let prompt = frame.prompt
        if (newInstructions) {
            prompt = `${prompt}\n\nAdditional refinements: ${newInstructions}`
        }

        // Generate new frame
        const result = await studioAI.generateImage({
            prompt,
            referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
            aspectRatio: (project.aspect_ratio as any) || '16:9',
            numberOfImages: 1,
        })

        if (!result.success || !result.data?.images.length) {
            return { error: result.error || 'Failed to regenerate frame' }
        }

        // Upload new image
        const filename = `frame_${shot.id}_${frame.frame_type}_${Date.now()}.png`
        const url = await uploadImage(project.id, result.data.images[0].base64, filename)

        // Update frame - updated_at is handled by trigger
        await supabase
            .from('studio_frames')
            .update({
                url,
                prompt: newInstructions ? prompt : frame.prompt,
            })
            .eq('id', frameId)

        revalidatePath(`/dashboard2/studio/${project.id}`)

        return {}
    } catch (error) {
        console.error('Error regenerating frame:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Update motion prompt for a shot
 */
export async function updateMotionPrompt(
    shotId: string,
    prompt: string
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // First get the shot to get project_id
        const { data: shot } = await supabase
            .from('studio_shots')
            .select('project_id')
            .eq('id', shotId)
            .single()

        if (!shot) {
            return { error: 'Shot not found' }
        }

        // Upsert motion prompt - project_id is required, updated_at is handled by trigger
        const { error } = await supabase
            .from('studio_motion_prompts')
            .upsert({
                shot_id: shotId,
                project_id: shot.project_id,
                prompt,
            }, {
                onConflict: 'shot_id',
            })

        if (error) {
            console.error('Failed to update motion prompt:', error)
            return { error: 'Failed to update motion prompt' }
        }

        return {}
    } catch (error) {
        return { error: 'Internal server error' }
    }
}
