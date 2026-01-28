// server/actions/studio/index.ts
// ============================================
// Studio Server Actions - Main Export
// ============================================

// Project actions
export {
    createStudioProject,
    getStudioProject,
    getStudioProjects,
    updateStudioProject,
    deleteStudioProject,
} from './projects'

// Concept actions
export {
    generateConcepts,
    selectConcept,
    getConcepts,
} from './concepts'

// Storyline actions
export {
    generateStoryline,
    getShots,
    updateShot,
    deleteShot,
    reorderShots,
} from './storyline'

// Hero image actions
export {
    generateHeroImages,
    getHeroImages,
    selectHeroImages,
    regenerateHeroImage,
} from './hero-images'

// Storyboard actions
export {
    generateStoryboardFrames,
    getStoryboardData,
    regenerateFrame,
    updateMotionPrompt,
} from './storyboard'

// Video actions
export {
    generateAllVideos,
    generateShotVideo,
    getVideoStatus,
} from './video'
