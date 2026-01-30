'use server'

// server/actions/studio/v2-generate.ts
// ============================================
// Generation Actions for V2 Studio
// Image, Video, Upscale, Script Breakdown
// ============================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import sharp from 'sharp'
import { studioAI, ImageInput } from '@/lib/ai/studio-client'
import { uploadImage } from '@/lib/storage'
import type {
    V2Asset,
    GenerateImageOptions,
    GenerateVideoOptions,
} from '@/lib/studio/v2-types'

interface GenerationResult {
    data?: V2Asset[] // Changed to array
    error?: string
}

/**
 * Generate an image and save as V2 asset
 */
export async function generateV2Image(
    projectId: string,
    options: GenerateImageOptions
): Promise<GenerationResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { error: 'Unauthorized' }
        }

        // Verify project ownership
        const { data: project, error: projectError } = await supabase
            .from('v2_projects')
            .select('*')
            .eq('id', projectId)
            .eq('user_id', user.id)
            .single()

        if (projectError || !project) {
            return { error: 'Project not found' }
        }

        const count = options.count || 1;
        const placeholders: V2Asset[] = [];

        // Create placeholder assets with processing status
        // We do this concurrently
        await Promise.all(Array.from({ length: count }).map(async () => {
            const { data: placeholderAsset, error: insertError } = await supabase
                .from('v2_assets')
                .insert({
                    project_id: projectId,
                    type: 'image',
                    status: 'processing',
                    metadata: {
                        prompt: options.prompt,
                        negative_prompt: options.negative_prompt,
                        width: options.width || 1920,
                        height: options.height || 1080,
                        seed: options.seed,
                        model: options.model || 'flux',
                        anchors_used: options.anchors,
                        shot_id: options.shot_id,
                    },
                    is_temporary: true,
                })
                .select()
                .single()

            if (!insertError && placeholderAsset) {
                placeholders.push(placeholderAsset as V2Asset)
            }
        }));

        if (placeholders.length === 0) {
            return { error: 'Failed to create assets' }
        }

        // Prepare reference images
        const referenceImages: ImageInput[] = []
        if (options.reference_urls && options.reference_urls.length > 0) {
            console.log(`[Generate] Fetching ${options.reference_urls.length} reference images`)

            await Promise.all(options.reference_urls.map(async (url) => {
                try {
                    const response = await fetch(url)

                    if (!response.ok) {
                        console.error('[Generate] Failed to fetch reference image:', url, response.status)
                        return
                    }

                    const arrayBuffer = await response.arrayBuffer()
                    const base64 = Buffer.from(arrayBuffer).toString('base64')
                    const mimeType = response.headers.get('content-type') || 'image/jpeg'

                    referenceImages.push({
                        base64,
                        mimeType: mimeType as ImageInput['mimeType'],
                    })
                } catch (err) {
                    console.warn('Could not fetch reference image:', url, err)
                }
            }))
        }

        // Apply anchors to prompt
        let enhancedPrompt = options.prompt
        if (options.anchors && options.anchors.length > 0) {
            const anchors = (project.anchors as any[]) || []
            const activeAnchors = anchors.filter(a => options.anchors!.includes(a.id) && a.is_active)
            const styleAnchors = activeAnchors.filter(a => a.type === 'style').map(a => a.value)
            const negAnchors = activeAnchors.filter(a => a.type === 'negative').map(a => a.value)

            if (styleAnchors.length > 0) {
                enhancedPrompt = `${enhancedPrompt}, ${styleAnchors.join(', ')}`
            }
            if (negAnchors.length > 0 && !options.negative_prompt) {
                options.negative_prompt = negAnchors.join(', ')
            }
        }

        // Prepare Azure config from environment if available
        const azureConfig = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY ? {
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
        } : undefined

        // Determine which model to use based on user selection
        const useAzure = options.model === 'azure' || (options.model === undefined && !!azureConfig)
        const modelToUse = useAzure ? 'gpt-image-1' : undefined

        // Determine quality based on resolution or passed option
        // If width > 1024 or height > 1024, prefer HD
        const isHD = (options.width || 0) > 1024 || (options.height || 0) > 1024

        // Generate image(s)
        // Pass count here!
        const result = await studioAI.generateImage({
            prompt: enhancedPrompt,
            negativePrompt: options.negative_prompt,
            referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
            aspectRatio: getAspectRatio(options.width, options.height) as any,
            width: options.width,
            height: options.height,
            quality: isHD ? 'hd' : 'standard',
            output_format: options.output_format,
            output_compression: options.output_compression,
            background: options.background,
            numberOfImages: count, // Use input count
            model: modelToUse,
            azureConfig: useAzure ? azureConfig : undefined,
        })

        if (!result.success || !result.data?.images.length) {
            // Update all placeholders with error
            await Promise.all(placeholders.map(p =>
                supabase
                    .from('v2_assets')
                    .update({
                        status: 'failed',
                        error_message: result.error || 'Generation failed',
                    })
                    .eq('id', p.id)
            ));

            return { error: result.error || 'Failed to generate image' }
        }

        // Match results to placeholders
        // If we got fewer images than requested, we fail the excess placeholders
        // If we got more, we ignore the extras (shouldn't happen with correct API usage)

        const finalAssets: V2Asset[] = []

        await Promise.all(placeholders.map(async (placeholder, idx) => {
            const generatedImage = result.data?.images[idx]

            if (!generatedImage) {
                // Mark as failed if no corresponding image
                await supabase.from('v2_assets').update({ status: 'failed', error_message: 'Image not generated' }).eq('id', placeholder.id)
                return
            }

            // Upload to storage
            const filename = `v2_${Date.now()}_${idx}.png`
            const mediaUrl = await uploadImage(projectId, generatedImage.base64, filename)

            // Update asset with result
            const { data: updatedAsset, error: updateError } = await supabase
                .from('v2_assets')
                .update({
                    media_url: mediaUrl,
                    status: 'ready',
                    metadata: {
                        ...placeholder.metadata,
                        model: result.model,
                        seed: options.seed,
                        reference_urls: options.reference_urls,
                    },
                })
                .eq('id', placeholder.id)
                .select()
                .single()

            if (!updateError && updatedAsset) {
                finalAssets.push(updatedAsset as V2Asset)
            }
        }))

        revalidatePath('/dashboard2/studio-new')
        return { data: finalAssets }

    } catch (error) {
        console.error('Error generating V2 image:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Generate a video from an image (image-to-video)
 */
export async function generateV2Video(
    projectId: string,
    options: GenerateVideoOptions
): Promise<GenerationResult> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { error: 'Unauthorized' }
        }

        // Create placeholder asset
        const { data: placeholderAsset, error: insertError } = await supabase
            .from('v2_assets')
            .insert({
                project_id: projectId,
                type: 'video',
                status: 'processing',
                metadata: {
                    prompt: options.prompt,
                    duration_seconds: options.duration || 4,
                    model: options.model || 'veo',
                    width: 720,
                    height: 1280,
                    anchors_used: options.anchors,
                    shot_id: options.shot_id,
                    reference_url: options.image_url,
                },
                is_temporary: true,
            })
            .select()
            .single()

        if (insertError) {
            return { error: 'Failed to create asset' }
        }

        // Prepare Azure config from environment
        const azureConfig = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY ? {
            endpoint: process.env.AZURE_OPENAI_ENDPOINT,
            apiKey: process.env.AZURE_OPENAI_API_KEY,
        } : undefined

        // Determine which model to use
        // Determine model and config
        const modelToUse = options.model || (azureConfig ? 'sora-2' : undefined)
        const useAzure = modelToUse === 'sora-2' || options.model === 'azure'

        // Get video dimensions from metadata  
        const videoWidth = (placeholderAsset.metadata as any).width || 720
        const videoHeight = (placeholderAsset.metadata as any).height || 1280

        // Convert reference image URL to base64 and resize to match video dimensions
        let startFrame: { base64: string; mimeType: 'image/jpeg' | 'image/png' | 'image/webp' } | undefined
        if (options.image_url) {
            try {
                console.log('[Video] Fetching and resizing reference image to', videoWidth, 'x', videoHeight)

                const response = await fetch(options.image_url)

                if (!response.ok) {
                    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
                }

                const arrayBuffer = await response.arrayBuffer()
                const inputBuffer = Buffer.from(arrayBuffer)

                // Resize image to EXACT video dimensions using sharp
                const resizedBuffer = await sharp(inputBuffer)
                    .resize(videoWidth, videoHeight, {
                        fit: 'cover', // Crop to fill exact dimensions
                        position: 'center' // Center the crop
                    })
                    .jpeg({ quality: 95 }) // Convert to JPEG for consistency
                    .toBuffer()

                const base64 = resizedBuffer.toString('base64')

                console.log('[Video] Resized image:', {
                    originalSize: inputBuffer.length,
                    resizedSize: resizedBuffer.length,
                    dimensions: `${videoWidth}x${videoHeight}`
                })

                startFrame = {
                    base64,
                    mimeType: 'image/jpeg'
                }
            } catch (err) {
                console.error('Could not fetch/resize reference image for video:', err)

                // Update asset status to failed
                await supabase
                    .from('v2_assets')
                    .update({
                        status: 'error',
                        metadata: {
                            ...placeholderAsset.metadata,
                            error: 'Reference image inaccessible or invalid'
                        }
                    })
                    .eq('id', placeholderAsset.id)

                return { error: 'Could not process reference image. Please re-upload it.' }
            }
        }

        // Generate video
        const result = await studioAI.generateVideo({
            prompt: options.prompt,
            startFrame,
            durationSeconds: (options.duration || 4) as 4 | 6 | 8,
            model: modelToUse,
            azureConfig: useAzure ? azureConfig : undefined,
        })

        if (!result.success) {
            await supabase
                .from('v2_assets')
                .update({
                    status: 'failed',
                    error_message: result.error || 'Video generation failed',
                })
                .eq('id', placeholderAsset.id)

            return { error: result.error || 'Failed to generate video' }
        }

        // Update asset with result
        const { data: updatedAsset, error: updateError } = await supabase
            .from('v2_assets')
            .update({
                media_url: result.data?.videoBase64 ? `data:video/mp4;base64,${result.data.videoBase64}` : null,
                status: 'ready',
                metadata: {
                    ...placeholderAsset.metadata,
                    duration_seconds: options.duration || 4,
                },
            })
            .eq('id', placeholderAsset.id)
            .select()
            .single()

        if (updateError) {
            return { error: 'Failed to save video' }
        }

        revalidatePath('/dashboard2/studio-new')
        return { data: [updatedAsset as V2Asset] }

    } catch (error) {
        console.error('Error generating V2 video:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Create a variation of an existing asset
 */
export async function createV2Variation(
    assetId: string,
    modifiedPrompt?: string
): Promise<GenerationResult> {
    try {
        const supabase = await createClient()

        // Get the parent asset
        const { data: parentAsset, error: fetchError } = await supabase
            .from('v2_assets')
            .select('*')
            .eq('id', assetId)
            .single()

        if (fetchError || !parentAsset) {
            return { error: 'Asset not found' }
        }

        const metadata = parentAsset.metadata as any
        const prompt = modifiedPrompt || metadata?.prompt || ''

        if (parentAsset.type === 'image') {
            // Generate variation using parent as reference
            const result = await generateV2Image(parentAsset.project_id, {
                prompt,
                reference_urls: parentAsset.media_url ? [parentAsset.media_url] : undefined,
                width: metadata?.width,
                height: metadata?.height,
            })

            if (result.data && result.data.length > 0) {
                // Update parent_id to link lineage for the first generated variation
                // (Usually variation is 1:1, but if we supported batch variation, we'd loop)
                const newAsset = result.data[0]
                await supabase
                    .from('v2_assets')
                    .update({ parent_id: assetId })
                    .eq('id', newAsset.id)

                // Return single result format for compatibility if needed, 
                // or we update the return type of createV2Variation too.
                // The interface GenerationResult is defined locally in this file AND used by createV2Variation.
                // So createV2Variation signature implicitly returns the NEW GenerationResult (Array).
                // But we should probably just return the whole result.
                return result
            }

            return result
        }

        return { error: 'Cannot create variation for this asset type' }

    } catch (error) {
        console.error('Error creating variation:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Parse a script into shots (Narrative Spine)
 */
export async function breakdownScript(
    projectId: string,
    scriptText: string
): Promise<{ data?: { shots: Array<{ id: string; content: string }> }; error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return { error: 'Unauthorized' }
        }

        // Create script asset
        const { data: scriptAsset, error: insertError } = await supabase
            .from('v2_assets')
            .insert({
                project_id: projectId,
                type: 'script',
                content: scriptText,
                status: 'ready',
                is_temporary: false,
            })
            .select()
            .single()

        if (insertError) {
            return { error: 'Failed to save script' }
        }

        // Parse script into shots
        // Priority per design brief:
        // 1. Explicit scene headers (INT./EXT., SCENE:)
        // 2. Paragraph breaks
        // 3. Location/time cues

        const lines = scriptText.split('\n').filter(l => l.trim())
        const shots: Array<{ id: string; content: string }> = []
        let currentScene = ''
        let shotCounter = 0
        let sceneCounter = 0

        for (const line of lines) {
            const trimmed = line.trim()

            // Check for scene headers
            const isSceneHeader = /^(INT\.|EXT\.|SCENE\s*:)/i.test(trimmed) ||
                /^(FADE IN|FADE OUT|CUT TO)/i.test(trimmed)

            if (isSceneHeader) {
                sceneCounter++
                shotCounter = 0
                currentScene = `S${sceneCounter}`
                shots.push({
                    id: currentScene,
                    content: trimmed,
                })
            } else if (trimmed.length > 10) {
                // Regular content becomes a shot
                shotCounter++
                const shotId = currentScene ? `${sceneCounter}${String.fromCharCode(64 + shotCounter)}` : `${shots.length + 1}A`
                shots.push({
                    id: shotId,
                    content: trimmed,
                })
            }
        }

        revalidatePath('/dashboard2/studio-new')
        return { data: { shots } }

    } catch (error) {
        console.error('Error breaking down script:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Helper to determine aspect ratio from dimensions
 */
function getAspectRatio(width?: number, height?: number): '16:9' | '9:16' | '1:1' | '4:3' {
    if (!width || !height) return '16:9'

    const ratio = width / height

    if (Math.abs(ratio - 16 / 9) < 0.1) return '16:9'
    if (Math.abs(ratio - 9 / 16) < 0.1) return '9:16'
    if (Math.abs(ratio - 1) < 0.1) return '1:1'
    if (Math.abs(ratio - 4 / 3) < 0.1) return '4:3'

    return '16:9' // Default
}
