import { create } from 'zustand'
import type { V2Asset, V2Project } from './v2-types'

// ============================================
// Studio V2 Zustand Store
// Manages local state + server action integration
// ============================================

export interface Shot {
    id: string
    title: string
    description?: string
    assetIds: string[]
}

export interface GenerationSettings {
    // Lighting
    lighting?: string
    // Camera
    cameraAngle?: 'eye-level' | 'high' | 'low' | 'dutch'
    lens?: 'wide' | 'normal' | 'telephoto'
    // Format
    aspectRatio?: '16:9' | '9:16' | '1:1' | '4:5' | '3:2' | '2:3'
    resolution?: '720p' | '1080p' | '4k'
    // Motion (for video)
    duration?: 4 | 6 | 8
    cameraMovement?: string
    // Advanced
    seed?: number
    negativePrompt?: string
    model?: string
    // Output
    format?: 'jpeg' | 'png'
    compression?: number
    background?: 'transparent'
    quality?: 'low' | 'medium' | 'high' | 'auto'
}

export interface StudioState {
    // Project Context
    projectId: string | null
    project: V2Project | null
    setProject: (project: V2Project | null) => void

    // Assets
    assets: V2Asset[]
    setAssets: (assets: V2Asset[]) => void
    addAsset: (asset: V2Asset) => void
    updateAsset: (assetId: string, updates: Partial<V2Asset>) => void
    removeAsset: (assetId: string) => void

    // Shots
    shots: Shot[]
    setShots: (shots: Shot[]) => void
    addShot: (shot: Shot) => void
    bindAssetToShot: (assetId: string, shotId: string | null) => void

    // UI State
    activeShotId: string | null
    setActiveShotId: (id: string | null) => void

    activeAssetId: string | null // For Detail Modal
    setActiveAssetId: (id: string | null) => void

    hoveredAssetId: string | null
    setHoveredAssetId: (id: string | null) => void

    // Generation State
    generationMode: 'image' | 'video'
    setGenerationMode: (mode: 'image' | 'video') => void

    // Prompt State (Global to allow external updates)
    prompt: string
    setPrompt: (prompt: string) => void

    generationSettings: GenerationSettings
    updateGenerationSettings: (settings: Partial<GenerationSettings>) => void
    resetGenerationSettings: () => void

    referenceImages: string[] // URLs
    addReferenceImage: (url: string) => void
    removeReferenceImage: (url: string) => void
    clearReferenceImages: () => void

    isGenerating: boolean
    setIsGenerating: (isGenerating: boolean) => void

    // Queue for concurrent generations
    generationQueue: Array<{ id: string; prompt: string; count: number }>
    addToQueue: (item: { id: string; prompt: string; count: number }) => void
    removeFromQueue: (id: string) => void

    generatingAssetId: string | null // Track which asset is being generated
    setGeneratingAssetId: (id: string | null) => void

    // Loading States
    isLoadingAssets: boolean
    setIsLoadingAssets: (loading: boolean) => void
    isLoadingProject: boolean
    setIsLoadingProject: (loading: boolean) => void

    // Error State
    error: string | null
    setError: (error: string | null) => void

    // Reset
    reset: () => void
}

const initialState = {
    projectId: null,
    project: null,
    assets: [],
    shots: [],
    activeShotId: null,
    activeAssetId: null,
    hoveredAssetId: null,
    prompt: "",
    generationMode: 'image' as const,
    generationSettings: {},
    referenceImages: [],
    isGenerating: false,
    generatingAssetId: null,
    isLoadingAssets: false,
    isLoadingProject: false,
    error: null,
}

export const useStudioStore = create<StudioState>((set, get) => ({
    ...initialState,

    // Project
    setProject: (project) => set({
        project,
        projectId: project?.id || null
    }),

    // Assets
    setAssets: (assets) => set({ assets }),

    addAsset: (asset) => set((state) => ({
        assets: [asset, ...state.assets]
    })),

    updateAsset: (assetId, updates) => set((state) => ({
        assets: state.assets.map((a) =>
            a.id === assetId ? { ...a, ...updates } : a
        ),
    })),

    removeAsset: (assetId) => set((state) => ({
        assets: state.assets.filter((a) => a.id !== assetId),
    })),

    // Shots
    setShots: (shots) => set({ shots }),

    addShot: (shot) => set((state) => ({
        shots: [...state.shots, shot],
    })),

    bindAssetToShot: (assetId, shotId) => {
        const { shots, updateAsset } = get()

        // Update asset metadata
        updateAsset(assetId, {
            metadata: {
                ...get().assets.find(a => a.id === assetId)?.metadata,
                shot_id: shotId,
            } as any,
        })

        // Update shots array
        set({
            shots: shots.map(shot => {
                // Remove from all shots
                const filtered = shot.assetIds.filter(id => id !== assetId)
                // Add to target shot
                if (shot.id === shotId) {
                    return { ...shot, assetIds: [...filtered, assetId] }
                }
                return { ...shot, assetIds: filtered }
            }),
        })
    },

    // UI State
    setActiveShotId: (id) => set({ activeShotId: id }),
    setActiveAssetId: (id) => set({ activeAssetId: id }),
    setHoveredAssetId: (id) => set({ hoveredAssetId: id }),

    // Generation Mode & Settings
    setGenerationMode: (mode) => set({ generationMode: mode }),
    setPrompt: (prompt) => set({ prompt }),

    updateGenerationSettings: (settings) => set((state) => ({
        generationSettings: { ...state.generationSettings, ...settings },
    })),

    resetGenerationSettings: () => set({ generationSettings: {} }),

    // Reference Images
    addReferenceImage: (url) => set((state) => ({
        referenceImages: [...state.referenceImages, url],
    })),

    removeReferenceImage: (url) => set((state) => ({
        referenceImages: state.referenceImages.filter(u => u !== url),
    })),

    clearReferenceImages: () => set({ referenceImages: [] }),

    // Generation
    setIsGenerating: (isGenerating) => set({ isGenerating }),

    generationQueue: [],
    addToQueue: (item) => set((state) => ({
        generationQueue: [...state.generationQueue, item],
        isGenerating: true
    })),
    removeFromQueue: (id) => set((state) => {
        const newQueue = state.generationQueue.filter(i => i.id !== id)
        return {
            generationQueue: newQueue,
            isGenerating: newQueue.length > 0
        }
    }),

    setGeneratingAssetId: (id) => set({ generatingAssetId: id }),

    // Loading
    setIsLoadingAssets: (loading) => set({ isLoadingAssets: loading }),
    setIsLoadingProject: (loading) => set({ isLoadingProject: loading }),

    // Error
    setError: (error) => set({ error }),

    // Reset
    reset: () => set(initialState),
}))

// ============================================
// Selector Hooks (for performance)
// ============================================

export const useAssets = () => useStudioStore((state) => state.assets)
export const useProject = () => useStudioStore((state) => state.project)
export const useIsGenerating = () => useStudioStore((state) => state.isGenerating)
export const useGenerationMode = () => useStudioStore((state) => state.generationMode)
export const useGenerationSettings = () => useStudioStore((state) => state.generationSettings)
export const useActiveAsset = () => {
    const assets = useStudioStore((state) => state.assets)
    const activeId = useStudioStore((state) => state.activeAssetId)
    return assets.find((a) => a.id === activeId) || null
}
export const useShots = () => useStudioStore((state) => state.shots)
export const useUnboundAssets = () => {
    const assets = useStudioStore((state) => state.assets)
    return assets.filter(a => !(a.metadata as any)?.shot_id)
}
