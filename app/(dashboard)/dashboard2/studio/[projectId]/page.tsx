'use client'

import { use, useEffect } from 'react'
import { useStudioStore } from '@/lib/dashboard2/store'
import { useProject } from '@/lib/dashboard2/hooks'
import { StudioLayout } from '@/components/dashboard2/studio/studio-layout'
import { ConceptSelector } from '@/components/dashboard2/studio/concept/concept-selector'
import { StorylineEditor } from '@/components/dashboard2/studio/storyline/storyline-editor'
import { HeroImageSelector } from '@/components/dashboard2/studio/hero-image/hero-selector'
import { StoryboardEditor } from '@/components/dashboard2/studio/storyboard/storyboard-editor'
import { VideoGeneration } from '@/components/dashboard2/studio/generation/video-generation'
import { VideoEditor } from '@/components/dashboard2/studio/editor/video-editor'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'

interface StudioPageProps {
  params: Promise<{ projectId: string }>
}

export default function StudioPage({ params }: StudioPageProps) {
  const { projectId } = use(params)
  const { currentStep } = useStudioStore()
  
  // Load project data from server
  const { project, isLoading, error, isInitialized } = useProject(projectId)
  
  if (isLoading || !isInitialized) {
    return (
      <StudioLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Loader2 className="w-16 h-16 text-purple-500 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading studio...</p>
          </div>
        </div>
      </StudioLayout>
    )
  }
  
  if (error) {
    return (
      <StudioLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
              <span className="text-2xl">⚠️</span>
            </div>
            <p className="text-red-500 font-medium mb-2">Error loading project</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      </StudioLayout>
    )
  }
  
  if (!project) {
    return (
      <StudioLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Project not found</p>
          </div>
        </div>
      </StudioLayout>
    )
  }
  
  return (
    <StudioLayout>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="h-full"
        >
          {currentStep === 'concept' && <ConceptSelector />}
          {currentStep === 'storyline' && <StorylineEditor />}
          {currentStep === 'hero-image' && <HeroImageSelector />}
          {currentStep === 'storyboard' && <StoryboardEditor />}
          {currentStep === 'generation' && <VideoGeneration />}
          {currentStep === 'editor' && <VideoEditor />}
        </motion.div>
      </AnimatePresence>
    </StudioLayout>
  )
}
