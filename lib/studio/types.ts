// lib/studio/types.ts
// ============================================
// TypeScript Types for Dashboard2 Studio
// Matches database schema
// ============================================

/**
 * Workflow step identifiers
 */
export type WorkflowStep =
    | 'concept'
    | 'storyline'
    | 'hero-image'
    | 'storyboard'
    | 'generation'
    | 'editor'

/**
 * Project status
 */
export type ProjectStatus = 'draft' | 'in-progress' | 'completed'

/**
 * Generation status
 */
export type GenerationStatus = 'pending' | 'generating' | 'completed' | 'failed'

/**
 * Hero image type
 */
export type HeroImageType = 'hero' | 'product' | 'style' | 'environment'

/**
 * Frame type
 */
export type FrameType = 'start' | 'end'

// ==========================================
// Database Table Types (matches Supabase)
// ==========================================

/**
 * Studio Project - main project record
 */
export interface StudioProject {
    id: string
    user_id: string
    name: string
    description: string | null
    prompt: string
    reference_image_url: string | null
    visual_style: string | null
    user_notes: string | null
    uploaded_files: any[]
    shot_count: number
    aspect_ratio: string
    current_step: WorkflowStep
    selected_concept: StudioConcept | null
    selected_hero_images: SelectedHeroImage[]
    status: ProjectStatus
    estimated_credits: number
    credits_used: number
    created_at: string
    updated_at: string
}

/**
 * Studio Concept - generated ad concept
 */
export interface StudioConcept {
    id: string
    project_id: string
    name: string
    tagline: string | null
    description: string
    visual_style: string | null
    color_palette: string | null
    pacing: string | null
    camera_work: string | null
    key_moments: string[]
    /** Technical cinematography profile - camera, lens, lighting, color grade specs for consistency */
    technical_profile: string | null
    is_selected: boolean
    created_at: string
}

/**
 * Studio Shot - individual shot in storyline
 * DB schema: id, project_id, order_index, title, description, voiceover_action
 */
export interface StudioShot {
    id: string
    project_id: string
    order_index: number
    title: string
    description: string
    voiceover_action: string | null
    created_at: string
    updated_at: string
}

/**
 * Studio Hero Image - generated reference image
 */
export interface StudioHeroImage {
    id: string
    project_id: string
    url: string
    prompt: string
    label: string | null
    type: HeroImageType
    is_selected: boolean
    created_at: string
}

/**
 * Selected hero image with label (stored in project)
 */
export interface SelectedHeroImage {
    id: string
    url: string
    label: string
    prompt: string
}

/**
 * Studio Frame - storyboard frame
 */
export interface StudioFrame {
    id: string
    shot_id: string
    project_id: string
    frame_type: FrameType
    url: string | null
    prompt: string
    status: GenerationStatus
    error_message: string | null
    created_at: string
    updated_at: string
}

/**
 * Studio Motion Prompt - video direction
 */
export interface StudioMotionPrompt {
    id: string
    shot_id: string
    project_id: string
    prompt: string
    created_at: string
    updated_at: string
}

/**
 * Studio Video - generated video
 */
export interface StudioVideo {
    id: string
    shot_id: string
    project_id: string
    url: string | null
    download_url: string | null
    duration_seconds: number | null
    status: GenerationStatus
    error_message: string | null
    is_approved: boolean
    credits_cost: number
    created_at: string
    updated_at: string
}

/**
 * Studio Generation Log - AI generation tracking
 */
export interface StudioGenerationLog {
    id: string
    project_id: string
    generation_type:
    | 'concept'
    | 'storyline'
    | 'hero_image'
    | 'storyboard_frame'
    | 'motion_prompt'
    | 'video'
    reference_id: string | null
    model_used: string
    prompt_used: string | null
    status: 'processing' | 'completed' | 'failed'
    error_message: string | null
    result_summary: string | null
    started_at: string
    completed_at: string | null
}

// ==========================================
// Composite Types (with relations)
// ==========================================

/**
 * Shot with all related data
 */
export interface StudioShotWithData extends StudioShot {
    start_frame: StudioFrame | null
    end_frame: StudioFrame | null
    motion_prompt: StudioMotionPrompt | null
    video: StudioVideo | null
}

/**
 * Full project with all related data
 */
export interface StudioProjectWithData extends StudioProject {
    concepts: StudioConcept[]
    shots: StudioShotWithData[]
    hero_images: StudioHeroImage[]
}

// ==========================================
// Input Types (for creating/updating)
// ==========================================

/**
 * Create project input
 */
export interface CreateStudioProjectInput {
    name?: string
    prompt: string
    reference_image_url?: string
    visual_style?: string
    user_notes?: string
    shot_count?: number
    aspect_ratio?: string
}

/**
 * Update project input
 */
export interface UpdateStudioProjectInput {
    name?: string
    description?: string
    prompt?: string
    visual_style?: string
    user_notes?: string
    shot_count?: number
    aspect_ratio?: string
    current_step?: WorkflowStep
    status?: ProjectStatus
}

/**
 * Update shot input
 */
export interface UpdateStudioShotInput {
    title?: string
    description?: string
    voiceover_action?: string
}

/**
 * Create shot input
 */
export interface CreateStudioShotInput {
    project_id: string
    order_index: number
    title: string
    description: string
    voiceover_action?: string
}
