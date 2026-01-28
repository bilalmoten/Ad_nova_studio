// lib/studio/config.ts
// ============================================
// Application Configuration for Dashboard2 Studio
// Edit these settings to change app behavior
// ============================================

/**
 * Main studio configuration
 */
export const STUDIO_CONFIG = {
    // ==========================================
    // Workflow Steps Configuration
    // ==========================================
    workflow: {
        steps: [
            { id: 'concept', label: 'Choose Concept', icon: 'Lightbulb' },
            { id: 'storyline', label: 'Define Storyline', icon: 'BookOpen' },
            { id: 'hero-image', label: 'Hero Assets', icon: 'Image' },
            { id: 'storyboard', label: 'Storyboard', icon: 'Film' },
            { id: 'generation', label: 'Generate Video', icon: 'Video' },
            { id: 'editor', label: 'Export', icon: 'Download' },
        ] as const,

        /** Allow users to skip ahead in workflow (not recommended) */
        allowSkipSteps: false,

        /** Allow users to go back to previous steps */
        allowBackNavigation: true,
    },

    // ==========================================
    // UI Behavior Settings
    // ==========================================
    ui: {
        /** Auto-save interval in milliseconds (0 to disable) */
        autoSaveInterval: 30000,

        /** Show credit/cost estimate before video generation */
        showCreditEstimate: true,

        /** Maximum number of hero images user can select */
        maxHeroImageSelections: 5,

        /** Require labels when selecting multiple hero images */
        requireLabelsForMultipleHero: true,

        /** Show toast notifications for actions */
        showToastNotifications: true,

        /** Enable animations and transitions */
        enableAnimations: true,
    },

    // ==========================================
    // Feature Flags
    // Toggle features on/off
    // ==========================================
    features: {
        /** Enable AI instruction input for regeneration */
        enableAIInstructions: true,

        /** Enable image editing with AI */
        enableImageEditing: true,

        /** Enable video regeneration after initial generation */
        enableVideoRegeneration: true,

        /** Enable final export functionality */
        enableExport: true,

        /** Enable drag-to-reorder for shots */
        enableShotReordering: true,

        /** Enable reference image upload */
        enableReferenceUpload: true,

        /** Show generation log/history */
        showGenerationLog: false,
    },

    // ==========================================
    // Limits and Constraints
    // ==========================================
    limits: {
        /** Maximum projects per user (0 for unlimited) */
        maxProjectsPerUser: 50,

        /** Maximum shots per project */
        maxShotsPerProject: 15,

        /** Minimum shots per project */
        minShotsPerProject: 3,

        /** Maximum hero images that can be generated */
        maxHeroImages: 10,

        /** Maximum file size for uploaded references (bytes) */
        maxUploadSize: 10 * 1024 * 1024, // 10MB

        /** Allowed upload file types */
        allowedUploadTypes: ['image/png', 'image/jpeg', 'image/webp'],
    },

    // ==========================================
    // API and Performance
    // ==========================================
    api: {
        /** Timeout for AI generation requests (ms) */
        generationTimeout: 120000, // 2 minutes

        /** Delay between batch generations to avoid rate limits (ms) */
        batchDelay: 1000,

        /** Number of retries for failed generations */
        maxRetries: 2,

        /** Polling interval for video generation status (ms) */
        videoPollingInterval: 5000,
    },

    // ==========================================
    // Default Values
    // ==========================================
    defaults: {
        /** Default project name */
        projectName: 'Untitled Project',

        /** Default number of shots */
        shotCount: 5,

        /** Default aspect ratio */
        aspectRatio: '16:9',

        /** Default visual style if none provided */
        visualStyle: 'Cinematic, modern, professional',
    },
}

/**
 * Workflow step type
 */
export type WorkflowStepId =
    (typeof STUDIO_CONFIG.workflow.steps)[number]['id']

/**
 * Get step configuration by ID
 */
export function getStepConfig(stepId: WorkflowStepId) {
    return STUDIO_CONFIG.workflow.steps.find((s) => s.id === stepId)
}

/**
 * Get next step ID
 */
export function getNextStep(
    currentStepId: WorkflowStepId
): WorkflowStepId | null {
    const steps = STUDIO_CONFIG.workflow.steps
    const currentIndex = steps.findIndex((s) => s.id === currentStepId)
    if (currentIndex < steps.length - 1) {
        return steps[currentIndex + 1].id
    }
    return null
}

/**
 * Get previous step ID
 */
export function getPreviousStep(
    currentStepId: WorkflowStepId
): WorkflowStepId | null {
    const steps = STUDIO_CONFIG.workflow.steps
    const currentIndex = steps.findIndex((s) => s.id === currentStepId)
    if (currentIndex > 0) {
        return steps[currentIndex - 1].id
    }
    return null
}

/**
 * Check if a step is accessible based on workflow rules
 */
export function isStepAccessible(
    targetStepId: WorkflowStepId,
    currentStepId: WorkflowStepId
): boolean {
    const steps = STUDIO_CONFIG.workflow.steps
    const targetIndex = steps.findIndex((s) => s.id === targetStepId)
    const currentIndex = steps.findIndex((s) => s.id === currentStepId)

    // Can always go back
    if (targetIndex <= currentIndex) {
        return STUDIO_CONFIG.workflow.allowBackNavigation
    }

    // Can only go forward one step at a time (unless skip is allowed)
    if (STUDIO_CONFIG.workflow.allowSkipSteps) {
        return true
    }

    return targetIndex === currentIndex + 1
}
