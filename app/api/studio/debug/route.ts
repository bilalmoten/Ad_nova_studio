// app/api/studio/debug/route.ts
// ============================================
// Debug route for testing AI generation
// Returns full data for display (images as base64, videos as URLs)
// ============================================

import { NextRequest, NextResponse } from 'next/server'
import { studioAI, STUDIO_MODELS, AzureConfig } from '@/lib/ai/studio-client'

export const maxDuration = 300 // 5 minutes for video generation

export async function GET() {
    return NextResponse.json({
        message: 'Studio AI Debug Route',
        models: STUDIO_MODELS,
        endpoints: {
            text: 'POST /api/studio/debug?type=text',
            image: 'POST /api/studio/debug?type=image',
            video: 'POST /api/studio/debug?type=video',
        },
    })
}

export async function POST(request: NextRequest) {
    try {
        const type = request.nextUrl.searchParams.get('type')
        const body = await request.json()


        if (!type || !['text', 'image', 'video'].includes(type)) {
            return NextResponse.json(
                { error: 'Invalid type. Use: text, image, or video' },
                { status: 400 }
            )
        }

        // Extract Azure Config if provided
        const { azureEndpoint, azureKey, model } = body
        let azureConfig: AzureConfig | undefined

        if (azureEndpoint && azureKey) {
            azureConfig = {
                endpoint: azureEndpoint,
                apiKey: azureKey,
            }
        }

        // Text Generation Test
        if (type === 'text') {
            const { prompt, systemPrompt } = body

            if (!prompt) {
                return NextResponse.json(
                    { error: 'prompt is required' },
                    { status: 400 }
                )
            }

            const result = await studioAI.generateText({
                prompt,
                systemPrompt,
                model,
                azureConfig
            })

            return NextResponse.json({
                type: 'text',
                model: result.model,
                success: result.success,
                durationMs: result.durationMs,
                data: result.data,
                error: result.error,
            })
        }

        // Image Generation Test
        if (type === 'image') {
            const { prompt, negativePrompt, aspectRatio } = body

            if (!prompt) {
                return NextResponse.json(
                    { error: 'prompt is required' },
                    { status: 400 }
                )
            }

            const result = await studioAI.generateImage({
                prompt,
                negativePrompt,
                aspectRatio: aspectRatio || '16:9',
                numberOfImages: 1,
                model,
                azureConfig
            })

            if (result.success && result.data) {
                // Return full base64 for display
                return NextResponse.json({
                    type: 'image',
                    model: result.model,
                    success: true,
                    durationMs: result.durationMs,
                    imageCount: result.data.images.length,
                    // Return full base64 data URL for direct display
                    images: result.data.images.map(img => ({
                        dataUrl: `data:${img.mimeType};base64,${img.base64}`,
                        mimeType: img.mimeType,
                    })),
                })
            }

            return NextResponse.json({
                type: 'image',
                model: result.model,
                success: false,
                durationMs: result.durationMs,
                error: result.error,
            })
        }

        // Video Generation Test
        if (type === 'video') {
            const { prompt, negativePrompt, aspectRatio } = body

            if (!prompt) {
                return NextResponse.json(
                    { error: 'prompt is required' },
                    { status: 400 }
                )
            }

            const result = await studioAI.generateVideo({
                prompt,
                negativePrompt,
                aspectRatio: aspectRatio || '16:9',
                model,
                azureConfig
            })

            if (result.success && result.data) {
                // Handle response - could be base64 or URL
                const videoData: any = { isUrl: !!result.data.videoUrl }

                if (result.data.videoUrl) {
                    videoData.url = result.data.videoUrl
                    // For Sora 2, we might just have the URL. 
                    // If frontend needs base64, we might need to fetch it here or let frontend fetch it.
                    // For now, let's pass the URL.
                }

                if (result.data.videoBase64) {
                    videoData.dataUrl = `data:video/mp4;base64,${result.data.videoBase64}`
                }

                return NextResponse.json({
                    type: 'video',
                    model: result.model,
                    success: true,
                    durationMs: result.durationMs,
                    video: videoData,
                })
            }

            return NextResponse.json({
                type: 'video',
                model: result.model,
                success: false,
                durationMs: result.durationMs,
                error: result.error,
            })
        }

        return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
    } catch (error) {
        return NextResponse.json(
            {
                error: 'Internal server error',
                message: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        )
    }
}
