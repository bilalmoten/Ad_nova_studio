'use server'

// server/actions/studio/video.ts
// ============================================
// Video Generation Actions
// Uses: Start frame image, motion prompt, hero images as style reference
// ============================================

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { studioAI, ImageInput } from '@/lib/ai/studio-client'
import { VIDEO_PROMPTS, GENERATION_SETTINGS } from '@/lib/studio/prompts'
import { uploadVideo, getFreshSignedUrl } from '@/lib/storage'
import type { StudioVideo } from '@/lib/studio/types'

/**
 * Generate videos for all shots in a project
 * Uses: Start frame as image input, motion prompt, hero images as style reference
 */
export async function generateAllVideos(
    projectId: string
): Promise<{ error?: string }> {
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

        // Get shots with frames and motion prompts
        const { data: shots, error: shotsError } = await supabase
            .from('studio_shots')
            .select('*')
            .eq('project_id', projectId)
            .order('order_index')

        if (shotsError || !shots?.length) {
            return { error: 'No shots found' }
        }

        // Get frames and motion prompts for each shot
        const { data: frames } = await supabase
            .from('studio_frames')
            .select('*')
            .in('shot_id', shots.map(s => s.id))
            .eq('frame_type', 'start') // Column is frame_type, not type

        const { data: motionPrompts } = await supabase
            .from('studio_motion_prompts')
            .select('*')
            .in('shot_id', shots.map(s => s.id))

        // Get selected hero images for style reference
        const { data: heroImages } = await supabase
            .from('studio_hero_images')
            .select('*')
            .eq('project_id', projectId)
            .eq('is_selected', true)

        // Prepare hero images as style references
        const styleReferenceImages: ImageInput[] = []
        for (const img of heroImages || []) {
            try {
                const response = await fetch(img.url)
                const arrayBuffer = await response.arrayBuffer()
                const base64 = Buffer.from(arrayBuffer).toString('base64')
                const mimeType = response.headers.get('content-type') || 'image/png'
                styleReferenceImages.push({ base64, mimeType: mimeType as ImageInput['mimeType'] })
            } catch (err) {
                console.warn('Could not fetch hero image for video reference:', err)
            }
        }

        // Generate video for each shot
        for (const shot of shots) {
            const frame = frames?.find(f => f.shot_id === shot.id)
            const motionPrompt = motionPrompts?.find(m => m.shot_id === shot.id)

            if (!frame?.url) {
                console.warn(`No frame found for shot ${shot.id}, skipping video generation`)
                continue
            }

            // Mark as generating - delete existing then insert\n            await supabase.from('studio_videos').delete().eq('shot_id', shot.id)\n            await supabase.from('studio_videos').insert({\n                shot_id: shot.id,\n                project_id: projectId,\n                status: 'generating',\n            })

            try {
                // Refresh signed URL (they expire after 1 hour)
                console.log(`Refreshing signed URL for shot ${shot.id}...`)
                let frameUrl: string
                try {
                    frameUrl = await getFreshSignedUrl(frame.url)
                    console.log(`Fresh URL obtained for shot ${shot.id}`)
                } catch (urlError) {
                    console.error(`Failed to refresh URL for shot ${shot.id}, trying original:`, urlError)
                    frameUrl = frame.url // Fallback to original URL
                }

                // Fetch start frame as base64
                console.log(`Fetching frame for shot ${shot.id}: ${frameUrl.substring(0, 100)}...`)
                const frameResponse = await fetch(frameUrl)

                if (!frameResponse.ok) {
                    throw new Error(`Failed to fetch frame: ${frameResponse.status} ${frameResponse.statusText}`)
                }

                const frameBuffer = await frameResponse.arrayBuffer()
                const frameBase64 = Buffer.from(frameBuffer).toString('base64')

                // Validate base64 data
                if (!frameBase64 || frameBase64.length < 100) {
                    throw new Error(`Invalid frame data: base64 length is ${frameBase64?.length || 0}`)
                }

                // Normalize mime type - Veo API only accepts image/png or image/jpeg
                let frameMimeType = frameResponse.headers.get('content-type') || 'image/png'

                // Handle common mime type issues
                if (frameMimeType.includes('application/octet-stream') ||
                    frameMimeType.includes('binary')) {
                    // Detect from base64 magic bytes
                    if (frameBase64.startsWith('/9j/')) {
                        frameMimeType = 'image/jpeg'
                    } else if (frameBase64.startsWith('iVBORw')) {
                        frameMimeType = 'image/png'
                    } else {
                        frameMimeType = 'image/png' // Default to PNG
                    }
                }

                // Ensure we only use supported mime types
                if (!['image/png', 'image/jpeg'].includes(frameMimeType)) {
                    console.warn(`Unsupported mime type ${frameMimeType}, defaulting to image/png`)
                    frameMimeType = 'image/png'
                }

                console.log(`Frame for shot ${shot.id}: ${Math.round(frameBase64.length / 1024)}KB, mime: ${frameMimeType}`)

                // Build video prompt with technical profile for consistency
                const technicalProfile = project.selected_concept?.technical_profile ||
                    project.selected_concept?.technicalProfile ||
                    'Professional cinematic lighting'

                const videoPrompt = VIDEO_PROMPTS.generate({
                    shotTitle: shot.title,
                    shotDescription: shot.description,
                    motionPrompt: motionPrompt?.prompt || shot.description,
                    technicalProfile,
                    conceptVisualStyle: project.selected_concept?.visual_style || 'cinematic',
                })

                // Generate video
                const result = await studioAI.generateVideo({
                    prompt: videoPrompt,
                    negativePrompt: VIDEO_PROMPTS.negativePrompt,
                    startFrame: {
                        base64: frameBase64,
                        mimeType: frameMimeType as ImageInput['mimeType'],
                    },
                    referenceImages: styleReferenceImages.length > 0 ? styleReferenceImages : undefined,
                    aspectRatio: (project.aspect_ratio === '9:16' ? '9:16' : '16:9') as any,
                    resolution: GENERATION_SETTINGS.video.resolution,
                })

                if (result.success && result.data?.videoBase64) {
                    // Upload video
                    const filename = `video_${shot.id}_${Date.now()}.mp4`
                    console.log(`Uploading video for shot ${shot.id}...`)
                    const url = await uploadVideo(projectId, result.data.videoBase64, filename)
                    console.log(`Video uploaded for shot ${shot.id}: ${url}`)

                    // Delete existing video record if any, then insert new one
                    // (Using delete+insert since table lacks unique constraint on shot_id)
                    await supabase.from('studio_videos').delete().eq('shot_id', shot.id)

                    const { error: insertError } = await supabase
                        .from('studio_videos')
                        .insert({
                            shot_id: shot.id,
                            project_id: projectId,
                            url,
                            download_url: url,
                            duration_seconds: 6,
                            status: 'completed',
                        })

                    if (insertError) {
                        console.error(`Failed to save video record for shot ${shot.id}:`, insertError)
                    } else {
                        console.log(`Video record saved for shot ${shot.id}`)
                    }
                } else {
                    console.error(`Video generation failed for shot ${shot.id}:`, result.error)
                    // Delete existing, insert failed status
                    await supabase.from('studio_videos').delete().eq('shot_id', shot.id)
                    await supabase
                        .from('studio_videos')
                        .insert({
                            shot_id: shot.id,
                            project_id: projectId,
                            status: 'failed',
                            error_message: result.error || 'Unknown error',
                        })
                }
            } catch (err) {
                console.error(`Error generating video for shot ${shot.id}:`, err)
                await supabase.from('studio_videos').delete().eq('shot_id', shot.id)
                await supabase
                    .from('studio_videos')
                    .insert({
                        shot_id: shot.id,
                        project_id: projectId,
                        status: 'failed',
                        error_message: err instanceof Error ? err.message : 'Unknown error',
                    })
            }
        }

        console.log('All video generation completed!')

        // Log generation - schema: generation_type, model_used, prompt_used, status, result_summary
        await supabase.from('studio_generation_log').insert({
            project_id: projectId,
            generation_type: 'video',
            model_used: GENERATION_SETTINGS.video.model,
            prompt_used: 'Multiple video prompts',
            result_summary: `Generated videos for ${shots.length} shots`,
            status: 'completed',
        }).then(({ error }) => {
            if (error) console.error('Failed to log video generation:', error)
        })

        revalidatePath(`/dashboard2/studio/${projectId}`)

        return {}
    } catch (error) {
        console.error('Error generating videos:', error)
        return { error: 'Internal server error' }
    }
}

/**
 * Get video generation status for a project
 */
export async function getVideoStatus(projectId: string): Promise<{
    data?: {
        videos: StudioVideo[]
        progress: { total: number; completed: number; percent: number }
    }
    error?: string
}> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get all shots
        const { data: shots } = await supabase
            .from('studio_shots')
            .select('id')
            .eq('project_id', projectId)

        const shotIds = shots?.map(s => s.id) || []

        // Get videos
        const { data: videos, error } = await supabase
            .from('studio_videos')
            .select('*')
            .in('shot_id', shotIds)

        if (error) {
            return { error: 'Failed to fetch video status' }
        }

        const total = shotIds.length
        const completed = videos?.filter(v => v.status === 'completed').length || 0
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0

        return {
            data: {
                videos: videos || [],
                progress: { total, completed, percent },
            },
        }
    } catch (error) {
        return { error: 'Internal server error' }
    }
}

/**
 * Generate video for a single shot
 */
export async function generateShotVideo(
    shotId: string
): Promise<{ error?: string }> {
    try {
        const supabase = await createClient()

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
            return { error: 'Unauthorized' }
        }

        // Get shot with all context
        const { data: shot } = await supabase
            .from('studio_shots')
            .select('*, studio_projects!inner(*)')
            .eq('id', shotId)
            .single()

        if (!shot) {
            return { error: 'Shot not found' }
        }

        const project = (shot as any).studio_projects

        // Get frame and motion prompt
        const { data: frame } = await supabase
            .from('studio_frames')
            .select('*')
            .eq('shot_id', shotId)
            .eq('frame_type', 'start') // Column is frame_type
            .single()

        const { data: motionPrompt } = await supabase
            .from('studio_motion_prompts')
            .select('*')
            .eq('shot_id', shotId)
            .single()

        if (!frame?.url) {
            return { error: 'No frame found for this shot' }
        }

        // Mark as generating - delete existing then insert\n        await supabase.from('studio_videos').delete().eq('shot_id', shotId)\n        await supabase.from('studio_videos').insert({\n            shot_id: shotId,\n            project_id: project.id,\n            status: 'generating',\n        })

        // Refresh signed URL (they expire after 1 hour)
        console.log(`Refreshing signed URL for single shot ${shotId}...`)
        let frameUrl: string
        try {
            frameUrl = await getFreshSignedUrl(frame.url)
            console.log(`Fresh URL obtained for shot ${shotId}`)
        } catch (urlError) {
            console.error(`Failed to refresh URL for shot ${shotId}, trying original:`, urlError)
            frameUrl = frame.url
        }

        // Fetch frame with validation
        console.log(`Fetching frame for single shot ${shotId}: ${frameUrl.substring(0, 100)}...`)
        const frameResponse = await fetch(frameUrl)

        if (!frameResponse.ok) {
            return { error: `Failed to fetch frame: ${frameResponse.status}` }
        }

        const frameBuffer = await frameResponse.arrayBuffer()
        const frameBase64 = Buffer.from(frameBuffer).toString('base64')

        // Validate base64 data
        if (!frameBase64 || frameBase64.length < 100) {
            return { error: `Invalid frame data: base64 length is ${frameBase64?.length || 0}` }
        }

        // Normalize mime type - Veo API only accepts image/png or image/jpeg
        let frameMimeType = frameResponse.headers.get('content-type') || 'image/png'

        // Handle common mime type issues
        if (frameMimeType.includes('application/octet-stream') ||
            frameMimeType.includes('binary')) {
            if (frameBase64.startsWith('/9j/')) {
                frameMimeType = 'image/jpeg'
            } else if (frameBase64.startsWith('iVBORw')) {
                frameMimeType = 'image/png'
            } else {
                frameMimeType = 'image/png'
            }
        }

        if (!['image/png', 'image/jpeg'].includes(frameMimeType)) {
            console.warn(`Unsupported mime type ${frameMimeType}, defaulting to image/png`)
            frameMimeType = 'image/png'
        }

        console.log(`Frame for shot ${shotId}: ${Math.round(frameBase64.length / 1024)}KB, mime: ${frameMimeType}`)

        // Build prompt with technical profile
        const technicalProfile = project.selected_concept?.technical_profile ||
            project.selected_concept?.technicalProfile ||
            'Professional cinematic lighting'

        const videoPrompt = VIDEO_PROMPTS.generate({
            shotTitle: shot.title,
            shotDescription: shot.description,
            motionPrompt: motionPrompt?.prompt || shot.description,
            technicalProfile,
            conceptVisualStyle: project.selected_concept?.visual_style || 'cinematic',
        })

        // Generate
        const result = await studioAI.generateVideo({
            prompt: videoPrompt,
            negativePrompt: VIDEO_PROMPTS.negativePrompt,
            startFrame: {
                base64: frameBase64,
                mimeType: frameMimeType as ImageInput['mimeType'],
            },
            aspectRatio: (project.aspect_ratio === '9:16' ? '9:16' : '16:9') as any,
        })

        if (result.success && result.data?.videoBase64) {
            const filename = `video_${shotId}_${Date.now()}.mp4`
            const url = await uploadVideo(project.id, result.data.videoBase64, filename)

            await supabase
                .from('studio_videos')
                .update({
                    url,
                    download_url: url,
                    duration_seconds: 6, // Default duration
                    status: 'completed',
                })
                .eq('shot_id', shotId)
        } else {
            await supabase
                .from('studio_videos')
                .update({
                    status: 'failed',
                    error_message: result.error || 'Unknown error',
                })
                .eq('shot_id', shotId)
        }

        revalidatePath(`/dashboard2/studio/${project.id}`)

        return {}
    } catch (error) {
        console.error('Error generating shot video:', error)
        return { error: 'Internal server error' }
    }
}
