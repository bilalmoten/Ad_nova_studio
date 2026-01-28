'use client'

// lib/dashboard2/store.ts
// ============================================
// Dashboard2 Studio Store - Real Data Version
// ============================================

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
    StudioProject,
    StudioConcept,
    StudioShot,
    StudioHeroImage,
    StudioShotWithData,
    WorkflowStep,
} from '@/lib/studio/types'

interface StudioState {
    // Current project
    currentProject: StudioProject | null
    currentStep: WorkflowStep

    // Data
    concepts: StudioConcept[]
    shots: StudioShotWithData[]
    heroImages: StudioHeroImage[]

    // Loading states
    isLoading: boolean
    isGenerating: boolean
    error: string | null

    // Actions - Project
    setProject: (project: StudioProject | null) => void
    updateProject: (updates: Partial<StudioProject>) => void
    clearProject: () => void

    // Actions - Navigation
    setStep: (step: WorkflowStep) => void
    nextStep: () => void
    prevStep: () => void
    goToStep: (step: WorkflowStep) => void

    // Actions - Data
    setConcepts: (concepts: StudioConcept[]) => void
    setShots: (shots: StudioShotWithData[]) => void
    setHeroImages: (images: StudioHeroImage[]) => void

    // Actions - Concept
    selectConcept: (concept: StudioConcept) => void

    // Actions - Shots
    updateShot: (shotId: string, updates: Partial<StudioShot>) => void
    addShot: (shot: StudioShotWithData) => void
    deleteShot: (shotId: string) => void
    reorderShots: (shotIds: string[]) => void

    // Actions - Hero Images
    selectHeroImages: (images: { id: string; label: string }[]) => void

    // Actions - Loading
    setLoading: (loading: boolean) => void
    setGenerating: (generating: boolean) => void
    setError: (error: string | null) => void

    // Actions - Initialize from server
    initializeFromProject: (data: {
        project: StudioProject
        concepts?: StudioConcept[]
        shots?: StudioShotWithData[]
        heroImages?: StudioHeroImage[]
    }) => void
}

const STEP_ORDER: WorkflowStep[] = [
    'concept',
    'storyline',
    'hero-image',
    'storyboard',
    'generation',
    'editor',
]

export const useStudioStore = create<StudioState>()(
    persist(
        (set, get) => ({
            // Initial state
            currentProject: null,
            currentStep: 'concept',
            concepts: [],
            shots: [],
            heroImages: [],
            isLoading: false,
            isGenerating: false,
            error: null,

            // Project actions
            setProject: (project) => {
                set({
                    currentProject: project,
                    currentStep: project?.current_step || 'concept',
                })
            },

            updateProject: (updates) => {
                const current = get().currentProject
                if (!current) return
                set({
                    currentProject: { ...current, ...updates },
                    currentStep: updates.current_step || get().currentStep,
                })
            },

            clearProject: () => {
                set({
                    currentProject: null,
                    currentStep: 'concept',
                    concepts: [],
                    shots: [],
                    heroImages: [],
                    error: null,
                })
            },

            // Navigation actions
            setStep: (step) => {
                set({ currentStep: step })
            },

            nextStep: () => {
                const currentStep = get().currentStep
                const currentIndex = STEP_ORDER.indexOf(currentStep)
                if (currentIndex < STEP_ORDER.length - 1) {
                    set({ currentStep: STEP_ORDER[currentIndex + 1] })
                }
            },

            prevStep: () => {
                const currentStep = get().currentStep
                const currentIndex = STEP_ORDER.indexOf(currentStep)
                if (currentIndex > 0) {
                    set({ currentStep: STEP_ORDER[currentIndex - 1] })
                }
            },

            goToStep: (step) => {
                set({ currentStep: step })
            },

            // Data actions
            setConcepts: (concepts) => {
                set({ concepts })
            },

            setShots: (shots) => {
                set({ shots })
            },

            setHeroImages: (images) => {
                set({ heroImages: images })
            },

            // Concept actions
            selectConcept: (concept) => {
                // Update concepts selection state
                const concepts = get().concepts.map((c) => ({
                    ...c,
                    is_selected: c.id === concept.id,
                }))
                set({
                    concepts,
                    currentProject: get().currentProject
                        ? { ...get().currentProject!, selected_concept: concept }
                        : null,
                })
            },

            // Shot actions
            updateShot: (shotId, updates) => {
                const shots = get().shots.map((shot) =>
                    shot.id === shotId ? { ...shot, ...updates } : shot
                )
                set({ shots })
            },

            addShot: (shot) => {
                const shots = [...get().shots, shot].map((s, idx) => ({
                    ...s,
                    order_index: idx + 1,
                }))
                set({ shots })
            },

            deleteShot: (shotId) => {
                const shots = get()
                    .shots.filter((s) => s.id !== shotId)
                    .map((s, idx) => ({ ...s, order_index: idx + 1 }))
                set({ shots })
            },

            reorderShots: (shotIds) => {
                const currentShots = get().shots
                const reordered = shotIds
                    .map((id) => currentShots.find((s) => s.id === id))
                    .filter(Boolean)
                    .map((shot, idx) => ({ ...shot!, order_index: idx + 1 }))
                set({ shots: reordered })
            },

            // Hero image actions
            selectHeroImages: (selections) => {
                const images = get().heroImages.map((img) => {
                    const selection = selections.find((s) => s.id === img.id)
                    return {
                        ...img,
                        is_selected: !!selection,
                        label: selection?.label || img.label,
                    }
                })
                set({ heroImages: images })
            },

            // Loading actions
            setLoading: (isLoading) => set({ isLoading }),
            setGenerating: (isGenerating) => set({ isGenerating }),
            setError: (error) => set({ error }),

            // Initialize from server data
            initializeFromProject: ({ project, concepts, shots, heroImages }) => {
                set({
                    currentProject: project,
                    currentStep: project.current_step,
                    concepts: concepts || [],
                    shots: shots || [],
                    heroImages: heroImages || [],
                    error: null,
                })
            },
        }),
        {
            name: 'dashboard2-studio-storage',
            partialize: (state) => ({
                // Only persist project reference, not full data
                currentProject: state.currentProject
                    ? { id: state.currentProject.id }
                    : null,
                currentStep: state.currentStep,
            }),
        }
    )
)

// Selector hooks for convenience
export const useCurrentProject = () =>
    useStudioStore((state) => state.currentProject)
export const useCurrentStep = () =>
    useStudioStore((state) => state.currentStep)
export const useConcepts = () => useStudioStore((state) => state.concepts)
export const useShots = () => useStudioStore((state) => state.shots)
export const useHeroImages = () => useStudioStore((state) => state.heroImages)
export const useIsLoading = () => useStudioStore((state) => state.isLoading)
export const useIsGenerating = () =>
    useStudioStore((state) => state.isGenerating)
export const useError = () => useStudioStore((state) => state.error)
