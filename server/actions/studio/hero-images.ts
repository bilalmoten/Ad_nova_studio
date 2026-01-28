'use server'

// server/actions/studio/hero-images.ts
// ============================================
// Hero Image Generation Actions
// Uses: Concept, custom prompts, reference images
// ============================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { studioAI, ImageInput } from '@/lib/ai/studio-client'
import { HERO_IMAGE_PROMPTS, GENERATION_SETTINGS } from '@/lib/studio/prompts'
import { uploadImage } from '@/lib/storage'
import type { StudioHeroImage } from '@/lib/studio/types'

interface GenerateHeroImagesResult {
    data?: StudioHeroImage[]
    error?: string
}

/**
 * Generate hero images for a project
 * Uses: concept (if no custom prompt), reference images, custom prompt
 */
export async function generateHeroImages(
    projectId: string,
    customPrompt?: string
): Promise<GenerateHeroImagesResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get project
        const { data: project, error: projectError } = await supabase
            .from('studio_projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single()

        if (projectError || !project) {
            return { error: 'Project not found' }
        }

        // Prepare reference images
        const referenceImages: ImageInput[] = []
        const hasProductReferences = !!project.reference_image_url
        const hasCharacterReferences = false // Could be extended for character refs

        if (project.reference_image_url) {
            try {
                const response = await fetch(project.reference_image_url)
                const arrayBuffer = await response.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                const mimeType = response.headers.get('content-type') || 'image/jpeg'

                referenceImages.push({
                    base64,
                    mimeType: mimeType as ImageInput['mimeType'],
                })
            } catch (err) {
                console.warn('Could not fetch reference image:', err)
            }
        }

        // Fetch shots to create storyline summary for hero image context
        let storylineSummary: string | undefined
        const { data: shots } = await supabase
            .from('studio_shots')
            .select('title, description')
            .eq('project_id', projectId)
            .order('order_index')
            .limit(5)

        if (shots && shots.length > 0) {
            storylineSummary = shots.map((s, i) => `${i + 1}. ${s.title}: ${s.description}`).join('\n')
        }

        // Build prompt
        let prompt: string
        if (customPrompt) {
            const concept = project.selected_concept
            const technicalProfile = concept?.technical_profile || concept?.technicalProfile
            prompt = HERO_IMAGE_PROMPTS.enhance(customPrompt, technicalProfile)
        } else if (project.selected_concept) {
            const concept = project.selected_concept
            prompt = HERO_IMAGE_PROMPTS.generateFromConcept({
                concept: {
                    name: concept.name,
                    description: concept.description,
                    visualStyle: concept.visual_style || concept.visualStyle,
                    colorPalette: concept.color_palette || concept.colorPalette,
                    technicalProfile: concept.technical_profile || concept.technicalProfile,
                },
                storylineSummary,
                hasProductReferences,
                hasCharacterReferences,
            })
        } else {
            return { error: 'Please provide a prompt or select a concept first' }
        }

        // Generate image
        const result = await studioAI.generateImage({
            prompt,
            referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
            aspectRatio: (project.aspect_ratio as any) || '16:9',
            numberOfImages: GENERATION_SETTINGS.heroImages.imagesPerBatch,
        })

        if (!result.success || !result.data?.images.length) {
            return { error: result.error || 'Failed to generate images' }
        }

        // Upload images and save to database
        const heroImages: StudioHeroImage[] = []

        for (let i = 0; i < result.data.images.length; i++) {
            const img = result.data.images[i]
            const filename = `hero_${Date.now()}_${i}.png`

            // Upload to storage
            const url = await uploadImage(projectId, img.base64, filename)

            // Save to database - schema: url, prompt, label, type (hero|product|style|environment), is_selected
            const { data: inserted, error: insertError } = await supabase
                .from('studio_hero_images')
                .insert({
                    project_id: projectId,
                    url,
                    prompt: customPrompt || prompt,
                    type: 'hero', // Valid enum: hero, product, style, environment
                    is_selected: false,
                    label: null,
                })
                .select()
                .single()

            if (insertError) {
                console.error('Failed to insert hero image:', insertError)
            } else if (inserted) {
                heroImages.push(inserted)
            }
        }

        // Log generation - schema: generation_type, model_used, prompt_used, status, result_summary
        await supabase.from('studio_generation_log').insert({
            project_id: projectId,
            generation_type: 'hero_image',
            model_used: result.model,
            prompt_used: prompt,
            result_summary: `Generated ${heroImages.length} hero images`,
            status: 'completed',
        }).then(({ error }) => {
            if (error) console.error('Failed to log hero image generation:', error)
        })

        revalidatePath(`/dashboard2/studio/${projectId}`)

        return { data: heroImages }
    } catch (error) {
        console.error('Error generating hero images:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Select hero images with labels
 */
export async function selectHeroImages(
    projectId: string,
    selections: Array<{ imageId: string; label: string }>
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Clear all selections first
        await supabase
            .from('studio_hero_images')
            .update({ is_selected: false, label: null })
            .eq('project_id', projectId)

        // Update selected images with labels
        for (const selection of selections) {
            await supabase
                .from('studio_hero_images')
                .update({
                    is_selected: true,
                    label: selection.label,
                })
                .eq('id', selection.imageId)
        }

        // Get selected images for project update
        const { data: selectedImages } = await supabase
            .from('studio_hero_images')
            .select('*')
            .eq('project_id', projectId)
            .eq('is_selected', true)

        // Update project with selected images and advance workflow
        await supabase
            .from('studio_projects')
            .update({
                selected_hero_images: selectedImages || [],
                current_step: 'storyboard',
                updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)

        revalidatePath(`/dashboard2/studio/${projectId}`)

        return {}
    } catch (error) {
        console.error('Error selecting hero images:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Get hero images for a project
 */
export async function getHeroImages(projectId: string): Promise<{
    data?: StudioHeroImage[]
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('studio_hero_images')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: false })

        if (error) {
            return { error: 'Failed to fetch hero images' }
        }

        return { data }
    } catch (error) {
        return { error: 'Internal server error' }
    }
}

/**
 * Regenerate a specific hero image with new prompt
 */
export async function regenerateHeroImage(
    imageId: string,
    newPrompt?: string
): Promise<{ data?: StudioHeroImage; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get the image
        const { data: image, error: imageError } = await supabase
            .from('studio_hero_images')
            .select('*, studio_projects!inner(*)')
            .eq('id', imageId)
            .single()

        if (imageError || !image) {
            return { error: 'Image not found' }
        }

        const prompt = newPrompt ? HERO_IMAGE_PROMPTS.enhance(newPrompt) : image.prompt
        const project = (image as any).studio_projects

        // Get reference images
        const referenceImages: ImageInput[] = []
        if (project.reference_image_url) {
            try {
                const response = await fetch(project.reference_image_url)
                const arrayBuffer = await response.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                const mimeType = response.headers.get('content-type') || 'image/jpeg'

                referenceImages.push({
                    base64,
                    mimeType: mimeType as ImageInput['mimeType'],
                })
            } catch (err) {
                console.warn('Could not fetch reference image:', err)
            }
        }

        // Generate new image
        const result = await studioAI.generateImage({
            prompt,
            referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
            aspectRatio: (project.aspect_ratio as any) || '16:9',
            numberOfImages: 1,
        })

        if (!result.success || !result.data?.images.length) {
            return { error: result.error || 'Failed to regenerate image' }
        }

        // Upload new image
        const filename = `hero_${Date.now()}.png`
        const url = await uploadImage(image.project_id, result.data.images[0].base64, filename)

        // Update record - no updated_at column in studio_hero_images
        const { data: updated, error: updateError } = await supabase
            .from('studio_hero_images')
            .update({
                url,
                prompt: newPrompt || prompt,
            })
            .eq('id', imageId)
            .select()
            .single()

        if (updateError) {
            return { error: 'Failed to update image' }
        }

        revalidatePath(`/dashboard2/studio/${image.project_id}`)

        return { data: updated }
    } catch (error) {
        console.error('Error regenerating hero image:', error)
        return { error: 'Internal server error' }
    }
}
