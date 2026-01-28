'use client'

// lib/dashboard2/hooks.ts
// ============================================
// React Hooks for Dashboard2 Studio
// Using Zustand selectors to prevent infinite loops
// ============================================

import { useEffect, useCallback, useState, useRef } from 'react'
import { useStudioStore } from './store'
import { useToast } from '@/hooks/use-toast'

// Server actions
import {
    getStudioProject,
    updateStudioProject,
} from '@/server/actions/studio/projects'
import {
    generateConcepts as generateConceptsAction,
    selectConcept as selectConceptAction,
} from '@/server/actions/studio/concepts'
import {
    generateStoryline as generateStorylineAction,
    updateShot as updateShotAction,
    deleteShot as deleteShotAction,
    reorderShots as reorderShotsAction,
} from '@/server/actions/studio/storyline'
import {
    generateHeroImages as generateHeroImagesAction,
    selectHeroImages as selectHeroImagesAction,
    regenerateHeroImage as regenerateHeroImageAction,
} from '@/server/actions/studio/hero-images'
import {
    generateStoryboardFrames as generateStoryboardFramesAction,
    regenerateFrame as regenerateFrameAction,
    updateMotionPrompt as updateMotionPromptAction,
} from '@/server/actions/studio/storyboard'
import {
    generateAllVideos as generateAllVideosAction,
    getVideoStatus as getVideoStatusAction,
    generateShotVideo as generateShotVideoAction,
} from '@/server/actions/studio/video'

import type { WorkflowStep } from '@/lib/studio/types'

/**
 * Hook to load and manage a studio project
 */
export function useProject(projectId: string | null) {
    const { toast } = useToast()
    const setLoading = useStudioStore((s) => s.setLoading)
    const setError = useStudioStore((s) => s.setError)
    const initializeFromProject = useStudioStore((s) => s.initializeFromProject)
    const currentProject = useStudioStore((s) => s.currentProject)
    const isLoading = useStudioStore((s) => s.isLoading)
    const error = useStudioStore((s) => s.error)
    const [isInitialized, setIsInitialized] = useState(false)
    const loadingRef = useRef(false)

    const loadProject = useCallback(async () => {
        if (!projectId || loadingRef.current) return
        loadingRef.current = true

        setLoading(true)
        setError(null)

        const result = await getStudioProject(projectId)

        if (result.error) {
            setError(result.error)
            toast({ title: 'Error', description: result.error, variant: 'destructive' })
        } else if (result.data) {
            initializeFromProject({
                project: result.data,
                concepts: result.data.concepts,
                shots: result.data.shots,
                heroImages: result.data.hero_images,
            })
            setIsInitialized(true)
        }

        setLoading(false)
        loadingRef.current = false
    }, [projectId, setLoading, setError, initializeFromProject, toast])

    useEffect(() => {
        if (projectId && !isInitialized) {
            loadProject()
        }
    }, [projectId, isInitialized, loadProject])

    return {
        project: currentProject,
        isLoading,
        error,
        isInitialized,
        reload: loadProject,
    }
}

/**
 * Hook for concept generation and selection
 */
export function useConcepts(projectId: string) {
    const { toast } = useToast()
    const concepts = useStudioStore((s) => s.concepts)
    const isGenerating = useStudioStore((s) => s.isGenerating)

    const generate = useCallback(
        async (instructions?: string) => {
            const store = useStudioStore.getState()
            store.setGenerating(true)
            store.setError(null)

            const result = await generateConceptsAction(projectId, instructions)

            if (result.error) {
                store.setError(result.error)
                toast({ title: 'Generation failed', description: result.error, variant: 'destructive' })
            } else if (result.data) {
                store.setConcepts(result.data)
                toast({ title: 'Concepts generated', description: `${result.data.length} concepts created` })
            }

            store.setGenerating(false)
            return result
        },
        [projectId, toast]
    )

    const select = useCallback(
        async (conceptId: string) => {
            const store = useStudioStore.getState()
            store.setLoading(true)

            const result = await selectConceptAction(projectId, conceptId)

            if (result.error) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            } else {
                const selectedConcept = store.concepts.find((c) => c.id === conceptId)
                if (selectedConcept) {
                    store.selectConcept(selectedConcept)
                }
                store.nextStep()
                toast({ title: 'Concept selected', description: 'Moving to storyline' })
            }

            store.setLoading(false)
            return result
        },
        [projectId, toast]
    )

    return {
        concepts,
        isGenerating,
        generate,
        select,
    }
}

/**
 * Hook for storyline management
 */
export function useStoryline(projectId: string) {
    const { toast } = useToast()
    const shots = useStudioStore((s) => s.shots)
    const isGenerating = useStudioStore((s) => s.isGenerating)

    const generate = useCallback(
        async (instructions?: string) => {
            const store = useStudioStore.getState()
            store.setGenerating(true)
            store.setError(null)

            const result = await generateStorylineAction(projectId, instructions)

            if (result.error) {
                store.setError(result.error)
                toast({ title: 'Generation failed', description: result.error, variant: 'destructive' })
            } else if (result.data) {
                const shotsWithData = result.data.map((shot: any) => ({
                    ...shot,
                    start_frame: null,
                    end_frame: null,
                    motion_prompt: null,
                    video: null,
                }))
                store.setShots(shotsWithData)
                toast({ title: 'Storyline generated', description: `${result.data.length} shots created` })
            }

            store.setGenerating(false)
            return result
        },
        [projectId, toast]
    )

    const updateShot = useCallback(
        async (shotId: string, updates: any) => {
            useStudioStore.getState().updateShot(shotId, updates)
            const result = await updateShotAction(shotId, updates)
            if (result.error) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            }
            return result
        },
        [toast]
    )

    const deleteShot = useCallback(
        async (shotId: string) => {
            useStudioStore.getState().deleteShot(shotId)
            const result = await deleteShotAction(shotId)
            if (result.error) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            } else {
                toast({ title: 'Shot deleted' })
            }
            return result
        },
        [toast]
    )

    const reorderShots = useCallback(
        async (shotIds: string[]) => {
            useStudioStore.getState().reorderShots(shotIds)
            const result = await reorderShotsAction(projectId, shotIds)
            if (result.error) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            }
            return result
        },
        [projectId, toast]
    )

    const confirmStoryline = useCallback(async () => {
        const result = await updateStudioProject(projectId, { current_step: 'hero-image' })
        if (!result.error) {
            useStudioStore.getState().nextStep()
            toast({ title: 'Storyline confirmed', description: 'Moving to hero assets' })
        }
        return result
    }, [projectId, toast])

    return {
        shots,
        isGenerating,
        generate,
        updateShot,
        deleteShot,
        reorderShots,
        confirmStoryline,
    }
}

/**
 * Hook for hero image management
 */
export function useHeroImages(projectId: string) {
    const { toast } = useToast()
    const heroImages = useStudioStore((s) => s.heroImages)
    const isGenerating = useStudioStore((s) => s.isGenerating)

    const generate = useCallback(
        async (prompt?: string) => {
            const store = useStudioStore.getState()
            store.setGenerating(true)
            store.setError(null)

            const result = await generateHeroImagesAction(projectId, prompt)

            if (result.error) {
                store.setError(result.error)
                toast({ title: 'Generation failed', description: result.error, variant: 'destructive' })
            } else if (result.data) {
                store.setHeroImages([...store.heroImages, ...result.data])
                toast({ title: 'Images generated', description: `${result.data.length} images created` })
            }

            store.setGenerating(false)
            return result
        },
        [projectId, toast]
    )

    const selectImages = useCallback(
        async (selections: { imageId: string; label: string }[]) => {
            const store = useStudioStore.getState()
            store.setLoading(true)

            const result = await selectHeroImagesAction(projectId, selections)

            if (result.error) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            } else {
                store.selectHeroImages(selections.map(s => ({ id: s.imageId, label: s.label })))
                store.nextStep()
                toast({ title: 'Images selected', description: 'Moving to storyboard' })
            }

            store.setLoading(false)
            return result
        },
        [projectId, toast]
    )

    const regenerate = useCallback(
        async (imageId: string, prompt?: string) => {
            const store = useStudioStore.getState()
            store.setGenerating(true)

            const result = await regenerateHeroImageAction(imageId, prompt)

            if (result.error) {
                toast({ title: 'Regeneration failed', description: result.error, variant: 'destructive' })
            } else if (result.data) {
                const images = store.heroImages.map((img) =>
                    img.id === imageId ? result.data : img
                )
                store.setHeroImages(images as any)
                toast({ title: 'Image regenerated' })
            }

            store.setGenerating(false)
            return result
        },
        [toast]
    )

    return {
        heroImages,
        isGenerating,
        generate,
        selectImages,
        regenerate,
    }
}

/**
 * Hook for storyboard management
 */
export function useStoryboard(projectId: string) {
    const { toast } = useToast()
    const shots = useStudioStore((s) => s.shots)
    const isGenerating = useStudioStore((s) => s.isGenerating)

    const generateFrames = useCallback(async () => {
        const store = useStudioStore.getState()
        store.setGenerating(true)
        store.setError(null)

        const result = await generateStoryboardFramesAction(projectId)

        if (result.error) {
            store.setError(result.error)
            toast({ title: 'Generation failed', description: result.error, variant: 'destructive' })
        } else {
            toast({ title: 'Storyboard generated', description: 'Frames and motion prompts created' })
            const projectResult = await getStudioProject(projectId)
            if (projectResult.data) {
                store.setShots(projectResult.data.shots)
            }
        }

        store.setGenerating(false)
        return result
    }, [projectId, toast])

    const regenerateFrame = useCallback(
        async (frameId: string, instructions?: string) => {
            const store = useStudioStore.getState()
            store.setGenerating(true)

            const result = await regenerateFrameAction(frameId, instructions)

            if (result.error) {
                toast({ title: 'Regeneration failed', description: result.error, variant: 'destructive' })
            } else {
                toast({ title: 'Frame regenerated' })
                const projectResult = await getStudioProject(projectId)
                if (projectResult.data) {
                    store.setShots(projectResult.data.shots)
                }
            }

            store.setGenerating(false)
            return result
        },
        [projectId, toast]
    )

    const updateMotionPrompt = useCallback(
        async (shotId: string, prompt: string) => {
            const result = await updateMotionPromptAction(shotId, prompt)
            if (result.error) {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            } else {
                toast({ title: 'Motion prompt updated' })
            }
            return result
        },
        [toast]
    )

    const confirmStoryboard = useCallback(async () => {
        const result = await updateStudioProject(projectId, { current_step: 'generation' })
        if (!result.error) {
            useStudioStore.getState().nextStep()
            toast({ title: 'Storyboard confirmed', description: 'Ready for video generation' })
        }
        return result
    }, [projectId, toast])

    return {
        shots,
        isGenerating,
        generateFrames,
        regenerateFrame,
        updateMotionPrompt,
        confirmStoryboard,
    }
}

/**
 * Hook for video generation
 */
export function useVideoGeneration(projectId: string) {
    const { toast } = useToast()
    const shots = useStudioStore((s) => s.shots)
    const isGenerating = useStudioStore((s) => s.isGenerating)
    const [progress, setProgress] = useState({ total: 0, completed: 0, percent: 0 })
    const [isPolling, setIsPolling] = useState(false)

    const generateAll = useCallback(async () => {
        const store = useStudioStore.getState()
        store.setGenerating(true)
        store.setError(null)

        toast({ title: 'Starting video generation', description: 'This may take a few minutes' })

        const result = await generateAllVideosAction(projectId)

        if (result.error) {
            store.setError(result.error)
            toast({ title: 'Generation failed', description: result.error, variant: 'destructive' })
        } else {
            toast({ title: 'Videos generated', description: 'All videos are ready' })
        }

        store.setGenerating(false)
        return result
    }, [projectId, toast])

    const pollStatus = useCallback(async () => {
        const result = await getVideoStatusAction(projectId)
        if (result.data) {
            setProgress(result.data.progress)
            const projectResult = await getStudioProject(projectId)
            if (projectResult.data) {
                useStudioStore.getState().setShots(projectResult.data.shots)
            }
        }
        return result
    }, [projectId])

    // Polling effect with proper guards
    useEffect(() => {
        if (!isGenerating || isPolling) return

        setIsPolling(true)
        const interval = setInterval(async () => {
            const result = await pollStatus()
            if (result.data?.progress.completed === result.data?.progress.total) {
                clearInterval(interval)
                setIsPolling(false)
                useStudioStore.getState().setGenerating(false)
            }
        }, 5000)

        return () => {
            clearInterval(interval)
            setIsPolling(false)
        }
    }, [isGenerating, isPolling, pollStatus])

    const finalize = useCallback(async () => {
        const result = await updateStudioProject(projectId, {
            current_step: 'editor',
            status: 'completed',
        })
        if (!result.error) {
            useStudioStore.getState().nextStep()
            toast({ title: 'Project finalized', description: 'Ready for export' })
        }
        return result
    }, [projectId, toast])

    const regenerateShot = useCallback(async (shotId: string) => {
        const store = useStudioStore.getState()
        store.setGenerating(true)

        toast({ title: 'Regenerating video', description: 'This may take a minute...' })

        const result = await generateShotVideoAction(shotId)

        if (result.error) {
            toast({ title: 'Regeneration failed', description: result.error, variant: 'destructive' })
        } else {
            toast({ title: 'Video regenerated', description: 'Shot video updated' })
            // Refresh project data to get the new video
            const projectResult = await getStudioProject(projectId)
            if (projectResult.data) {
                store.setShots(projectResult.data.shots)
            }
        }

        store.setGenerating(false)
        return result
    }, [projectId, toast])

    return {
        shots,
        isGenerating,
        progress,
        generateAll,
        regenerateShot,
        pollStatus,
        finalize,
    }
}

/**
 * Hook for workflow navigation
 */
export function useWorkflowNavigation(projectId: string) {
    const { toast } = useToast()
    const currentStep = useStudioStore((s) => s.currentStep)
    const goToStepFn = useStudioStore((s) => s.goToStep)
    const nextStep = useStudioStore((s) => s.nextStep)
    const prevStep = useStudioStore((s) => s.prevStep)

    const goToStep = useCallback(
        async (step: WorkflowStep) => {
            const result = await updateStudioProject(projectId, { current_step: step })
            if (!result.error) {
                goToStepFn(step)
            } else {
                toast({ title: 'Error', description: result.error, variant: 'destructive' })
            }
            return result
        },
        [projectId, goToStepFn, toast]
    )

    return {
        currentStep,
        goToStep,
        nextStep,
        prevStep,
    }
}

/**
 * Clip settings for trim and speed
 */
export interface ClipSettings {
    trimStart: number // seconds from start to trim
    trimEnd: number // seconds from end to trim
    speed: number // 0.5 to 2.0
}

/**
 * Hook for video editor functionality
 */
export function useVideoEditor(projectId: string) {
    const { toast } = useToast()
    const shots = useStudioStore((s) => s.shots)

    // Playback state
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [currentClipIndex, setCurrentClipIndex] = useState(0)
    const [selectedClipId, setSelectedClipId] = useState<string | null>(null)

    // Clip settings (keyed by shot id)
    const [clipSettings, setClipSettings] = useState<Record<string, ClipSettings>>({})

    // Get clips with video data only
    const clips = shots.filter(shot => shot.video?.status === 'completed' && shot.video?.url)

    // Calculate total duration
    const getTotalDuration = useCallback(() => {
        return clips.reduce((total, shot) => {
            const settings = clipSettings[shot.id]
            const baseDuration = shot.video?.duration_seconds || 6
            const trimmedDuration = baseDuration - (settings?.trimStart || 0) - (settings?.trimEnd || 0)
            const adjustedDuration = trimmedDuration / (settings?.speed || 1)
            return total + Math.max(0, adjustedDuration)
        }, 0)
    }, [clips, clipSettings])

    // Get clip at specific time
    const getClipAtTime = useCallback((time: number) => {
        let elapsed = 0
        for (let i = 0; i < clips.length; i++) {
            const shot = clips[i]
            const settings = clipSettings[shot.id]
            const baseDuration = shot.video?.duration_seconds || 6
            const trimmedDuration = baseDuration - (settings?.trimStart || 0) - (settings?.trimEnd || 0)
            const adjustedDuration = trimmedDuration / (settings?.speed || 1)

            if (time < elapsed + adjustedDuration) {
                return { index: i, clipTime: time - elapsed }
            }
            elapsed += adjustedDuration
        }
        return { index: clips.length - 1, clipTime: 0 }
    }, [clips, clipSettings])

    // Playback controls
    const play = useCallback(() => setIsPlaying(true), [])
    const pause = useCallback(() => setIsPlaying(false), [])
    const togglePlayback = useCallback(() => setIsPlaying(prev => !prev), [])

    const seekTo = useCallback((time: number) => {
        const totalDuration = getTotalDuration()
        const clampedTime = Math.max(0, Math.min(time, totalDuration))
        setCurrentTime(clampedTime)

        const { index } = getClipAtTime(clampedTime)
        setCurrentClipIndex(index)
    }, [getTotalDuration, getClipAtTime])

    const nextClip = useCallback(() => {
        if (currentClipIndex < clips.length - 1) {
            setCurrentClipIndex(prev => prev + 1)
            // Calculate time at start of next clip
            let elapsed = 0
            for (let i = 0; i <= currentClipIndex; i++) {
                const shot = clips[i]
                const settings = clipSettings[shot.id]
                const baseDuration = shot.video?.duration_seconds || 6
                const trimmedDuration = baseDuration - (settings?.trimStart || 0) - (settings?.trimEnd || 0)
                const adjustedDuration = trimmedDuration / (settings?.speed || 1)
                elapsed += adjustedDuration
            }
            setCurrentTime(elapsed)
        }
    }, [currentClipIndex, clips, clipSettings])

    const prevClip = useCallback(() => {
        if (currentClipIndex > 0) {
            setCurrentClipIndex(prev => prev - 1)
            // Calculate time at start of previous clip
            let elapsed = 0
            for (let i = 0; i < currentClipIndex - 1; i++) {
                const shot = clips[i]
                const settings = clipSettings[shot.id]
                const baseDuration = shot.video?.duration_seconds || 6
                const trimmedDuration = baseDuration - (settings?.trimStart || 0) - (settings?.trimEnd || 0)
                const adjustedDuration = trimmedDuration / (settings?.speed || 1)
                elapsed += adjustedDuration
            }
            setCurrentTime(elapsed)
        }
    }, [currentClipIndex, clips, clipSettings])

    // Clip settings
    const updateClipSettings = useCallback((shotId: string, updates: Partial<ClipSettings>) => {
        setClipSettings(prev => {
            const existing = prev[shotId] || { trimStart: 0, trimEnd: 0, speed: 1 }
            return {
                ...prev,
                [shotId]: {
                    trimStart: updates.trimStart ?? existing.trimStart,
                    trimEnd: updates.trimEnd ?? existing.trimEnd,
                    speed: updates.speed ?? existing.speed,
                }
            }
        })
    }, [])

    // Shot reordering
    const reorderShots = useCallback(async (newOrder: string[]) => {
        const result = await reorderShotsAction(projectId, newOrder)
        if (result.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' })
        } else {
            useStudioStore.getState().reorderShots(newOrder)
        }
        return result
    }, [projectId, toast])

    // Select clip
    const selectClip = useCallback((shotId: string | null) => {
        setSelectedClipId(shotId)
        if (shotId) {
            const index = clips.findIndex(c => c.id === shotId)
            if (index >= 0) {
                setCurrentClipIndex(index)
            }
        }
    }, [clips])

    // Export as ZIP
    const exportAsZip = useCallback(async () => {
        toast({ title: 'Preparing export...', description: 'Downloading video files' })

        try {
            // For now, just open individual video URLs
            // Full ZIP implementation would require JSZip
            for (const shot of clips) {
                if (shot.video?.url) {
                    window.open(shot.video.url, '_blank')
                }
            }
            toast({ title: 'Videos ready', description: 'Videos opened in new tabs for download' })
        } catch {
            toast({ title: 'Export failed', description: 'Could not export videos', variant: 'destructive' })
        }
    }, [clips, toast])

    // Download single clip
    const downloadClip = useCallback(async (shotId: string) => {
        const shot = clips.find(c => c.id === shotId)
        if (shot?.video?.url) {
            window.open(shot.video.url, '_blank')
            toast({ title: 'Downloading', description: `Downloading ${shot.title}` })
        }
    }, [clips, toast])

    // Format time as MM:SS
    const formatTime = useCallback((seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = Math.floor(seconds % 60)
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }, [])

    return {
        // Clips data
        clips,
        selectedClipId,
        clipSettings,

        // Playback state
        isPlaying,
        currentTime,
        currentClipIndex,
        totalDuration: getTotalDuration(),

        // Playback controls
        play,
        pause,
        togglePlayback,
        seekTo,
        nextClip,
        prevClip,

        // Clip management
        selectClip,
        updateClipSettings,
        reorderShots,

        // Export
        exportAsZip,
        downloadClip,

        // Utilities
        formatTime,
        getClipAtTime,
    }
}
