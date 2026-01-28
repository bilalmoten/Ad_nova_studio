// lib/ai/studio-client.ts
// ============================================
// Unified AI Client for Studio
// Handles all AI generation with proper abstraction
// Supports Google Gemini and Azure OpenAI (OpenAM)
// ============================================

import { GoogleGenAI, Part } from '@google/genai'

import { AzureOpenAI } from 'openai'

// =====================
// MODEL CONFIGURATION
// =====================
export const STUDIO_MODELS = {
    // Text generation
    text: {
        gemini: 'gemini-3-pro-preview',
        openam: 'gpt-5.2'
    },

    // Image generation
    image: {
        gemini: 'gemini-3-pro-image-preview',
        openam: 'gpt-image-1'
    },

    // Video generation
    video: {
        gemini: 'veo-3.1-fast-generate-preview',
        openam: 'sora-2'
    }
} as const

// Helper type for flattened model names
export type StudioModelType =
    | typeof STUDIO_MODELS.text.gemini
    | typeof STUDIO_MODELS.text.openam
    | typeof STUDIO_MODELS.image.gemini
    | typeof STUDIO_MODELS.image.openam
    | typeof STUDIO_MODELS.video.gemini
    | typeof STUDIO_MODELS.video.openam

// =====================
// TYPE DEFINITIONS
// =====================

export interface AzureConfig {
    endpoint: string
    apiKey: string
    apiVersion?: string
}

export interface TextGenerationInput {
    prompt: string
    systemPrompt?: string
    images?: ImageInput[]
    responseSchema?: Record<string, unknown>
    temperature?: number
    model?: string
    azureConfig?: AzureConfig
}

export interface ImageInput {
    base64: string
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp'
}

export interface ImageGenerationInput {
    prompt: string
    negativePrompt?: string
    referenceImages?: ImageInput[]
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5'
    numberOfImages?: number
    model?: string
    azureConfig?: AzureConfig
}

export interface VideoGenerationInput {
    prompt: string
    negativePrompt?: string
    startFrame?: ImageInput
    endFrame?: ImageInput
    referenceImages?: ImageInput[]
    aspectRatio?: '16:9' | '9:16'
    durationSeconds?: 4 | 6 | 8
    resolution?: '720p' | '1080p'
    model?: string
    azureConfig?: AzureConfig
}

export interface GenerationResult<T> {
    success: boolean
    data?: T
    error?: string
    model: string
    durationMs?: number
}

// =====================
// STUDIO AI CLIENT
// =====================
class StudioAIClient {
    private googleClient: GoogleGenAI

    constructor() {
        const apiKey = process.env.GOOGLE_GENAI_API_KEY
        // We don't throw immediately if key is missing, to allow Azure-only usage if desired
        this.googleClient = new GoogleGenAI({ apiKey: apiKey || 'dummy' })
    }

    private getAzureClient(config: AzureConfig) {
        return new AzureOpenAI({
            endpoint: config.endpoint,
            apiKey: config.apiKey,
            apiVersion: config.apiVersion || '2024-12-01-preview', // Default to a recent preview
            deployment: '', // Deployment is often per-request or handled by base URL structure depending on Azure setup
        })
    }

    /**
     * Generate text
     */
    async generateText<T = string>(
        input: TextGenerationInput
    ): Promise<GenerationResult<T>> {
        const startTime = Date.now()
        const model = input.model || STUDIO_MODELS.text.gemini
        const isAzure = model === STUDIO_MODELS.text.openam

        try {
            if (isAzure) {
                // Config resolution: params > env > error
                const endpoint = input.azureConfig?.endpoint || process.env.AZURE_OPENAI_ENDPOINT
                const apiKey = input.azureConfig?.apiKey || process.env.AZURE_OPENAI_API_KEY

                if (!endpoint || !apiKey) {
                    throw new Error('Azure endpoint and API key are required (via inputs or env vars)')
                }

                // Build URL: https://film-studio-resource.openai.azure.com/openai/v1/chat/completions
                let baseUrl = endpoint.replace(/\/+$/, '')
                if (!baseUrl.includes('/openai/v1')) {
                    baseUrl = baseUrl + '/openai/v1'
                }
                const url = `${baseUrl}/chat/completions`

                // Build messages array
                const messages: any[] = []
                if (input.systemPrompt) {
                    messages.push({ role: 'system', content: input.systemPrompt })
                }
                messages.push({ role: 'user', content: input.prompt })

                console.log('[GPT-5.2] Generating text with:', { url, model: 'gpt-5.2', messageCount: messages.length })

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        messages,
                        model: 'gpt-5.2',
                        max_completion_tokens: 16384,
                        reasoning_effort: 'low',
                        temperature: input.temperature,
                        response_format: input.responseSchema ? { type: 'json_object' } : undefined
                    })
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('[GPT-5.2] API Error:', response.status, errorText)
                    throw new Error(`Azure Text API Error ${response.status}: ${errorText}`)
                }

                const data = await response.json()
                const text = data.choices[0].message.content || ''

                let result: T
                if (input.responseSchema) {
                    try {
                        result = JSON.parse(text) as T
                    } catch {
                        return {
                            success: false,
                            error: `Failed to parse JSON response`,
                            model,
                            durationMs: Date.now() - startTime
                        }
                    }
                } else {
                    result = text as T
                }

                return {
                    success: true,
                    data: result,
                    model,
                    durationMs: Date.now() - startTime
                }

            } else {
                // Google Gemini Implementation
                const parts: Part[] = []
                if (input.images?.length) {
                    for (const img of input.images) {
                        parts.push({
                            inlineData: {
                                data: img.base64,
                                mimeType: img.mimeType,
                            },
                        })
                    }
                }
                parts.push({ text: input.prompt })

                const config: Record<string, unknown> = {}
                if (input.systemPrompt) config.systemInstruction = input.systemPrompt
                if (input.temperature !== undefined) config.temperature = input.temperature
                if (input.responseSchema) {
                    config.responseMimeType = 'application/json'
                    config.responseSchema = input.responseSchema
                }

                const response = await this.googleClient.models.generateContent({
                    model,
                    contents: [{ role: 'user', parts }],
                    config,
                })

                const text = response.text || ''
                let data: T
                if (input.responseSchema) {
                    try {
                        data = JSON.parse(text) as T
                    } catch {
                        return {
                            success: false,
                            error: `Failed to parse JSON response: ${text.substring(0, 200)}`,
                            model,
                            durationMs: Date.now() - startTime,
                        }
                    }
                } else {
                    data = text as T
                }

                return {
                    success: true,
                    data,
                    model,
                    durationMs: Date.now() - startTime,
                }
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                model,
                durationMs: Date.now() - startTime,
            }
        }
    }

    /**
     * Generate images
     */
    async generateImage(
        input: ImageGenerationInput
    ): Promise<GenerationResult<{ images: Array<{ base64: string; mimeType: string }> }>> {
        const startTime = Date.now()
        const model = input.model || STUDIO_MODELS.image.gemini
        const isAzure = model === STUDIO_MODELS.image.openam

        try {
            if (isAzure) {
                // Config resolution: params > env > error
                const endpoint = input.azureConfig?.endpoint || process.env.AZURE_OPENAI_ENDPOINT
                const apiKey = input.azureConfig?.apiKey || process.env.AZURE_OPENAI_API_KEY

                if (!endpoint || !apiKey) {
                    throw new Error('Azure endpoint and API key are required (via inputs or env vars)')
                }

                // Build URL (matching curl structure - NO api-version)
                let baseUrl = endpoint.replace(/\/+$/, '')
                if (!baseUrl.includes('/openai/v1')) {
                    baseUrl = baseUrl + '/openai/v1'
                }
                const url = `${baseUrl}/images/generations`

                console.log('[GPT-Image] Generating with:', { url, model, promptLen: input.prompt.length })

                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        prompt: input.prompt,
                        model: 'gpt-image-1.5',  // Updated model version
                        size: '1024x1024',
                        quality: 'medium',
                        output_compression: 100,
                        output_format: 'png',
                        n: 1
                    })
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    console.error('[GPT-Image] API Error:', response.status, errorText)
                    throw new Error(`Azure Image API Error ${response.status}: ${errorText}`)
                }

                const data = await response.json()
                console.log('[GPT-Image] Response received, data keys:', Object.keys(data))

                // Response format: { data: [{ b64_json: "..." }] }
                if (!data.data || data.data.length === 0) {
                    return {
                        success: false,
                        error: 'No image data returned from Azure',
                        model,
                        durationMs: Date.now() - startTime
                    }
                }

                const images = data.data.map((img: any) => ({
                    base64: img.b64_json || '',
                    mimeType: 'image/png' as const
                }))

                return {
                    success: true,
                    data: { images },
                    model,
                    durationMs: Date.now() - startTime
                }

            } else {
                // Google Gemini Implementation
                const parts: Part[] = []
                if (input.referenceImages?.length) {
                    for (const img of input.referenceImages) {
                        parts.push({
                            inlineData: {
                                data: img.base64,
                                mimeType: img.mimeType,
                            },
                        })
                    }
                }

                let promptText = input.prompt
                if (input.negativePrompt) promptText += `\n\nAvoid: ${input.negativePrompt}`
                parts.push({ text: promptText })

                const response = await this.googleClient.models.generateContent({
                    model,
                    contents: [{ role: 'user', parts }],
                    config: { responseModalities: ['IMAGE'] } as any,
                })

                const images: Array<{ base64: string; mimeType: string }> = []
                if (response.candidates?.[0]?.content?.parts) {
                    for (const part of response.candidates[0].content.parts) {
                        if (part.inlineData) {
                            images.push({
                                base64: part.inlineData.data || '',
                                mimeType: part.inlineData.mimeType || 'image/png',
                            })
                        }
                    }
                }

                if (images.length === 0) {
                    return {
                        success: false,
                        error: 'No images generated',
                        model,
                        durationMs: Date.now() - startTime,
                    }
                }

                return {
                    success: true,
                    data: { images },
                    model,
                    durationMs: Date.now() - startTime,
                }
            }
        } catch (error) {
            console.error('[Image] Generation Error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                model,
                durationMs: Date.now() - startTime,
            }
        }
    }

    /**
     * Generate video
     */
    async generateVideo(
        input: VideoGenerationInput
    ): Promise<GenerationResult<{ videoBase64?: string; videoUrl?: string; mimeType: string }>> {
        const startTime = Date.now()
        const model = input.model || STUDIO_MODELS.video.gemini
        const isAzure = model === STUDIO_MODELS.video.openam

        try {
            if (isAzure) {
                // Config resolution: params > env > error
                const endpoint = input.azureConfig?.endpoint || process.env.AZURE_OPENAI_ENDPOINT
                const apiKey = input.azureConfig?.apiKey || process.env.AZURE_OPENAI_API_KEY

                if (!endpoint || !apiKey) {
                    throw new Error('Azure endpoint and API key are required (via inputs or env vars)')
                }

                // EXACT curl from Azure Foundry Playground:
                // POST "https://film-studio-resource.openai.azure.com/openai/v1/videos"
                // NO api-version query param!
                let baseUrl = endpoint.replace(/\/+$/, '')
                if (!baseUrl.includes('/openai/v1')) {
                    baseUrl = baseUrl + '/openai/v1'
                }
                const createUrl = `${baseUrl}/videos`

                // Determine resolution string (as per curl: "720x1280")
                let size = "720x1280"
                if (input.aspectRatio === '16:9') size = "1280x720"

                console.log('[Sora] Starting generation with:', { url: createUrl, model: 'sora-2', size, seconds: input.durationSeconds || 4, hasStartFrame: !!input.startFrame })

                // Prepare request body
                const requestBody: any = {
                    prompt: input.prompt,
                    size: size,
                    seconds: String(input.durationSeconds || 4),
                    model: 'sora-2'
                }

                // Add reference image if provided (image-to-video)
                if (input.startFrame) {
                    // Sora-2 expects input_reference as base64 image
                    requestBody.input_reference = `data:${input.startFrame.mimeType};base64,${input.startFrame.base64}`
                }

                // STEP 1: Create video
                const createResp = await fetch(createUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify(requestBody)
                })

                if (!createResp.ok) {
                    const errorText = await createResp.text()
                    console.error('[Sora] Create API Error:', createResp.status, errorText)
                    throw new Error(`Sora Create Error ${createResp.status}: ${errorText}`)
                }

                const videoData = await createResp.json()
                const videoId = videoData.id
                console.log('[Sora] Video creation started:', videoId, 'Status:', videoData.status)

                // STEP 2: Poll for completion
                const statusUrl = `${baseUrl}/videos/${videoId}`
                const maxWaitTime = 10 * 60 * 1000 // 10 mins
                const pollInterval = 5000
                let elapsed = 0
                let status = videoData.status

                while (!['completed', 'failed', 'cancelled'].includes(status) && elapsed < maxWaitTime) {
                    await new Promise(r => setTimeout(r, pollInterval))
                    elapsed += pollInterval

                    const pollResp = await fetch(statusUrl, {
                        headers: { 'Authorization': `Bearer ${apiKey}` }
                    })

                    if (!pollResp.ok) {
                        console.error('[Sora] Poll failed:', pollResp.status)
                        throw new Error('Polling failed')
                    }

                    const statusData = await pollResp.json()
                    status = statusData.status
                    console.log('[Sora] Video status:', status, 'Progress:', statusData.progress)
                }

                if (status !== 'completed') {
                    return {
                        success: false,
                        error: `Video generation ${status} (or timed out)`,
                        model,
                        durationMs: Date.now() - startTime
                    }
                }

                // STEP 3: Download video content
                const videoContentUrl = `${baseUrl}/videos/${videoId}/content`
                console.log('[Sora] Downloading video from:', videoContentUrl)

                const downloadResp = await fetch(videoContentUrl, {
                    headers: { 'Authorization': `Bearer ${apiKey}` }
                })

                if (!downloadResp.ok) {
                    console.error('[Sora] Download failed:', downloadResp.status)
                    return {
                        success: false,
                        error: 'Failed to download video content',
                        model,
                        durationMs: Date.now() - startTime
                    }
                }

                // Convert to base64
                const videoBuffer = await downloadResp.arrayBuffer()
                const videoBase64 = Buffer.from(videoBuffer).toString('base64')

                console.log('[Sora] Completed! Video size:', videoBuffer.byteLength, 'bytes')

                return {
                    success: true,
                    data: {
                        videoBase64: videoBase64,
                        mimeType: 'video/mp4'
                    },
                    model,
                    durationMs: Date.now() - startTime
                }

            } else {
                // Google Veo Implementation
                const config: Record<string, unknown> = {
                    aspectRatio: input.aspectRatio || '16:9',
                }
                if (input.negativePrompt) config.negativePrompt = input.negativePrompt

                const params: Record<string, unknown> = {
                    model,
                    prompt: input.prompt,
                    config,
                }
                if (input.startFrame) {
                    params.image = {
                        imageBytes: input.startFrame.base64,
                        mimeType: input.startFrame.mimeType,
                    }
                }

                // Add end frame if provided (moved from original code to keep logic)
                if (input.endFrame) {
                    params.lastFrame = {
                        image: {
                            imageBytes: input.endFrame.base64,
                            mimeType: input.endFrame.mimeType,
                        },
                    }
                }
                // Add reference images (moved from original code)
                if (input.referenceImages?.length) {
                    params.referenceImages = input.referenceImages.map((img, idx) => ({
                        referenceId: idx,
                        referenceType: 'REFERENCE_TYPE_STYLE',
                        image: {
                            imageBytes: img.base64,
                            mimeType: img.mimeType,
                        },
                    }))
                }

                let operation = await this.googleClient.models.generateVideos(params as any)

                // Poll...
                const maxWaitTime = 5 * 60 * 1000
                const pollInterval = 10000
                let elapsed = 0
                while (!operation.done && elapsed < maxWaitTime) {
                    await new Promise((resolve) => setTimeout(resolve, pollInterval))
                    elapsed += pollInterval
                    operation = await this.googleClient.operations.getVideosOperation({ operation })
                }

                if (!operation.done) {
                    return { success: false, error: 'Timeout', model, durationMs: Date.now() - startTime }
                }

                const video = operation.response?.generatedVideos?.[0]
                if (!video?.video?.uri) {
                    // Better error logging for Veo too
                    const errorReason = (operation as any).error?.message || (video as any)?.error?.message || 'No video URI'
                    return { success: false, error: errorReason, model, durationMs: Date.now() - startTime }
                }

                const apiKey = process.env.GOOGLE_GENAI_API_KEY
                const downloadUrl = `${video.video.uri}${video.video.uri.includes('?') ? '&' : '?'}key=${apiKey}`
                const videoResponse = await fetch(downloadUrl)
                const videoBase64 = Buffer.from(await videoResponse.arrayBuffer()).toString('base64')

                return {
                    success: true,
                    data: { videoBase64, mimeType: 'video/mp4' },
                    model,
                    durationMs: Date.now() - startTime,
                }
            }
        } catch (error) {
            console.error('[Studio] Generation Error:', error)
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                model,
                durationMs: Date.now() - startTime,
            }
        }
    }

    getModels() {
        return STUDIO_MODELS
    }
}

export const studioAI = new StudioAIClient()
export { StudioAIClient }
