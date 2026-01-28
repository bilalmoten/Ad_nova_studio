'use server'

// server/actions/studio/concepts.ts
// ============================================
// Concept Generation Actions
// Uses: Reference images (if provided), user prompt, style preferences
// ============================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { studioAI, ImageInput } from '@/lib/ai/studio-client'
import { CONCEPT_PROMPTS, GENERATION_SETTINGS } from '@/lib/studio/prompts'
import type { StudioConcept } from '@/lib/studio/types'

interface GenerateConceptsResult {
    data?: StudioConcept[]
    error?: string
}

/**
 * Generate concepts for a project
 * Uses: prompt, visual_style, user_notes, reference_image (if provided)
 */
export async function generateConcepts(
    projectId: string,
    userInstructions?: string
): Promise<GenerateConceptsResult> {
    try {
        const supabase = await createClient()

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get project with reference image if any
        const { data: project, error: projectError } = await supabase
            .from('studio_projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single()

        if (projectError || !project) {
            return { error: 'Project not found' }
        }

        // Prepare images for AI if reference image exists
        const images: ImageInput[] = []
        if (project.reference_image_url) {
            try {
                // Fetch the reference image and convert to base64
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

        // Build prompt
        let prompt = CONCEPT_PROMPTS.generate({
            prompt: project.prompt + (userInstructions ? `\n\nAdditional Instructions: ${userInstructions}` : ''),
            visualStyle: project.visual_style || undefined,
            userNotes: project.user_notes || undefined,
            hasReferenceImages: images.length > 0,
        })

        // Generate concepts using AI
        const result = await studioAI.generateText<{ concepts: any[] }>({
            prompt,
            systemPrompt: CONCEPT_PROMPTS.system,
            images: images.length > 0 ? images : undefined,
            responseSchema: CONCEPT_PROMPTS.schema,
            temperature: GENERATION_SETTINGS.concepts.temperature,
        })

        if (!result.success || !result.data?.concepts) {
            return { error: result.error || 'Failed to generate concepts' }
        }

        // Clear existing concepts for this project
        await supabase
            .from('studio_concepts')
            .delete()
            .eq('project_id', projectId)

        // Insert new concepts - schema: name, tagline, description, visual_style, color_palette (TEXT), pacing, camera_work, key_moments, technical_profile, is_selected
        const conceptsToInsert = result.data.concepts.map((concept: any) => ({
            project_id: projectId,
            name: concept.name,
            tagline: concept.tagline,
            description: concept.description,
            visual_style: concept.visualStyle,
            color_palette: Array.isArray(concept.colorPalette) ? concept.colorPalette.join(', ') : concept.colorPalette || null,
            pacing: concept.pacing,
            key_moments: concept.keyMoments || [],
            camera_work: concept.cameraWork,
            technical_profile: concept.technicalProfile || null, // NEW: Store technical profile for consistency
            is_selected: false,
        }))

        console.log('Inserting concepts:', JSON.stringify(conceptsToInsert, null, 2))

        const { data: insertedConcepts, error: insertError } = await supabase
            .from('studio_concepts')
            .insert(conceptsToInsert)
            .select()

        if (insertError) {
            console.error('Failed to save concepts:', insertError)
            return { error: `Failed to save concepts: ${insertError.message}` }
        }

        // Log generation - schema: generation_type, model_used, prompt_used, status, result_summary
        await supabase.from('studio_generation_log').insert({
            project_id: projectId,
            generation_type: 'concept',
            model_used: result.model,
            prompt_used: prompt,
            result_summary: `Generated ${result.data.concepts.length} concepts`,
            status: 'completed',
        }).then(({ error }) => {
            if (error) console.error('Failed to log concept generation:', error)
        })

        revalidatePath(`/dashboard2/studio/${projectId}`)

        return { data: insertedConcepts }
    } catch (error) {
        console.error('Error generating concepts:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Select a concept for a project
 */
export async function selectConcept(
    projectId: string,
    conceptId: string
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get the concept
        const { data: concept, error: conceptError } = await supabase
            .from('studio_concepts')
            .select('*')
            .eq('id', conceptId)
            .eq('project_id', projectId)
            .single()

        if (conceptError || !concept) {
            return { error: 'Concept not found' }
        }

        // Update all concepts to not selected
        await supabase
            .from('studio_concepts')
            .update({ is_selected: false })
            .eq('project_id', projectId)

        // Mark this concept as selected
        await supabase
            .from('studio_concepts')
            .update({ is_selected: true })
            .eq('id', conceptId)

        // Update project with selected concept and advance workflow
        await supabase
            .from('studio_projects')
            .update({
                selected_concept: concept,
                current_step: 'storyline',
                updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)

        revalidatePath(`/dashboard2/studio/${projectId}`)

        return {}
    } catch (error) {
        console.error('Error selecting concept:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Get concepts for a project
 */
export async function getConcepts(projectId: string): Promise<{
    data?: StudioConcept[]
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        const { data, error } = await supabase
            .from('studio_concepts')
            .select('*')
            .eq('project_id', projectId)
            .order('order_index')

        if (error) {
            return { error: 'Failed to fetch concepts' }
        }

        return { data }
    } catch (error) {
        return { error: 'Internal server error' }
    }
}
