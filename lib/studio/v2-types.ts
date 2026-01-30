// lib/studio/v2-types.ts
// ============================================
// TypeScript Types for Studio V2
// Matches v2_* database schema
// ============================================

/**
 * V2 Asset Types
 */
export type V2AssetType = 'script' | 'image' | 'video' | 'audio' | 'prompt_template'

/**
 * V2 Asset Status
 */
export type V2AssetStatus = 'processing' | 'ready' | 'failed'

/**
 * V2 Project - Workspace container with Global Anchors
 */
export interface V2Project {
    id: string
    user_id: string
    name: string
    description: string | null
    settings: V2ProjectSettings
    anchors: V2Anchor[]
    created_at: string
    updated_at: string
}

/**
 * Project settings stored as JSONB
 */
export interface V2ProjectSettings {
    aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3'
    default_model?: string
    default_style?: string
    shot_count?: number
    visual_style?: string
    user_notes?: string
    reference_image_url?: string
    initial_prompt?: string
}

/**
 * Global Anchor - Character, Style, or Negative prompt
 */
export interface V2Anchor {
    id: string
    type: 'character' | 'style' | 'negative'
    label: string
    value: string // Reference URL or prompt text
    is_active: boolean
}

/**
 * V2 Asset - Universal bin item (script, image, video, audio)
 */
export interface V2Asset {
    id: string
    project_id: string
    type: V2AssetType
    content: string | null // For scripts, prompts
    media_url: string | null // For images/videos (storage key or URL)
    parent_id: string | null // Lineage: parent asset for variations
    group_id: string | null // Links items in 2x2 grid
    metadata: V2AssetMetadata
    grid_config: V2GridConfig | null
    status: V2AssetStatus
    error_message: string | null
    token_cost: number
    is_temporary: boolean
    is_favorite: boolean
    is_archived: boolean
    created_at: string
    updated_at: string
}

/**
 * Asset metadata stored as JSONB
 */
export interface V2AssetMetadata {
    prompt?: string
    negative_prompt?: string
    seed?: number
    model?: string
    duration_seconds?: number
    width?: number
    height?: number
    camera_settings?: {
        lens?: string
        angle?: string
        aperture?: string
    }
    lighting?: string
    anchors_used?: string[] // IDs of anchors applied
    shot_id?: string // If bound to a shot
    is_upload?: boolean // Whether the asset was uploaded manually
}

/**
 * Grid configuration for sprite sheets
 */
export interface V2GridConfig {
    rows: number
    cols: number
}

/**
 * V2 Sequence - NLE Timeline
 */
export interface V2Sequence {
    id: string
    project_id: string
    name: string
    tracks: V2Track[]
    settings: V2SequenceSettings
    created_at: string
    updated_at: string
}

/**
 * Timeline track
 */
export interface V2Track {
    id: string
    type: 'video' | 'audio' | 'text'
    clips: V2Clip[]
}

/**
 * Timeline clip
 */
export interface V2Clip {
    id: string
    asset_id: string
    in_point: number // Start time in seconds
    out_point: number // End time in seconds
    duration: number
    position: number // Position on track
    effects?: any[]
}

/**
 * Sequence settings
 */
export interface V2SequenceSettings {
    fps: number
    resolution: '720p' | '1080p' | '4k'
}

// ==========================================
// Input Types
// ==========================================

/**
 * Create V2 Project input
 */
export interface CreateV2ProjectInput {
    name?: string
    description?: string
    settings?: V2ProjectSettings
    anchors?: V2Anchor[]
}

/**
 * Update V2 Project input
 */
export interface UpdateV2ProjectInput {
    name?: string
    description?: string
    settings?: V2ProjectSettings
    anchors?: V2Anchor[]
}

/**
 * Create V2 Asset input
 */
export interface CreateV2AssetInput {
    project_id: string
    type: V2AssetType
    content?: string
    media_url?: string
    parent_id?: string
    metadata?: V2AssetMetadata
    is_temporary?: boolean
}

/**
 * Update V2 Asset input
 */
export interface UpdateV2AssetInput {
    content?: string
    media_url?: string
    metadata?: V2AssetMetadata
    status?: V2AssetStatus
    error_message?: string
    is_favorite?: boolean
    is_archived?: boolean
    is_temporary?: boolean
}

/**
 * Generate Image options
 */
export interface GenerateImageOptions {
    prompt: string
    negative_prompt?: string
    width?: number
    height?: number
    seed?: number
    model?: string
    reference_urls?: string[] // Array of reference image URLs
    anchors?: string[] // Anchor IDs to apply
    shot_id?: string // Bind to shot
    count?: number // Number of images to generate
    quality?: 'low' | 'medium' | 'high' | 'auto'
    output_format?: 'jpeg' | 'png'
    output_compression?: number // 0-100
    background?: 'transparent' // or undefined
}

/**
 * Generate Video options
 */
export interface GenerateVideoOptions {
    prompt: string
    image_url?: string // Start frame
    duration?: number
    model?: string
    anchors?: string[]
    shot_id?: string
}
