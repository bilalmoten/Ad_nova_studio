// Dashboard2 TypeScript Types

export type ProjectStatus = 'draft' | 'in-progress' | 'completed'

export type WorkflowStep =
    | 'concept'
    | 'storyline'
    | 'hero-image'
    | 'storyboard'
    | 'generation'
    | 'editor'

export type AspectRatio = '16:9' | '9:16' | '1:1' | '4:5'

export type ImageType = 'product' | 'model' | 'style' | 'environment'

export type VideoStatus = 'generating' | 'complete' | 'error'

export interface Project {
    id: string
    name: string
    description: string
    status: ProjectStatus
    currentStep: WorkflowStep
    createdAt: Date
    updatedAt: Date
    thumbnail?: string

    // Project settings
    duration: number
    aspectRatio: AspectRatio
    numShots: number
    audioEnabled: boolean
    visualStyle?: string
    targetAudience?: string

    // Completed steps data
    selectedConcept?: Concept
    storyline?: Shot[]
    heroImages?: HeroImage[]
    storyboard?: StoryboardShot[]
    generatedVideos?: GeneratedVideo[]
}

export interface Concept {
    id: string
    name: string
    tagline: string
    description: string
    heroImage: string
    visualStyle: string
    colorPalette: string
    cameraWork: string
    pacing: string
    keyMoments: string[]
    targetProducts: string[]
}

export interface Shot {
    id: string
    order: number
    title: string
    description: string
    voiceoverAction: string
    duration: number
}

export interface HeroImage {
    id: string
    url: string
    type: ImageType
    prompt: string
}

export interface StoryboardShot {
    id: string
    shotId: string
    startFrame: {
        url: string
        prompt: string
    }
    endFrame?: {
        url: string
        prompt: string
    }
    motionPrompt: string
    duration: number
    approved: boolean
}

export interface GeneratedVideo {
    id: string
    shotId: string
    url: string
    duration: number
    status: VideoStatus
    approved: boolean
}

export interface TimelineClip {
    id: string
    videoId: string
    startTime: number
    duration: number
    trimStart: number
    trimEnd: number
    speed: number
}

export interface TextOverlay {
    id: string
    text: string
    startTime: number
    duration: number
    position: { x: number; y: number }
    style: {
        fontSize: number
        fontWeight: string
        color: string
        animation?: string
    }
}

export interface AudioTrack {
    id: string
    type: 'music' | 'effect'
    prompt: string
    url: string
    startTime: number
    duration: number
    volume: number
}
