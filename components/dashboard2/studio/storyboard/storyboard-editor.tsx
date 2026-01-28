'use client'

import { useState, useEffect } from 'react'
import { useStudioStore } from '@/lib/dashboard2/store'
import { useStoryboard } from '@/lib/dashboard2/hooks'
import { StepHeader } from '../step-header'
import { GlassCard } from '../../ui/glass-card'
import { GradientButton } from '../../ui/gradient-button'
import { getGradientFromId } from '@/lib/dashboard2/utils'
import { 
  Image as ImageIcon, 
  RefreshCw, 
  Wand2, 
  ChevronLeft, 
  ChevronRight, 
  ArrowRight,
  Pencil,
  Copy,
  Download,
  Film,
  X,
  Loader2,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'

export function StoryboardEditor() {
  const { currentProject } = useStudioStore()
  const { toast } = useToast()
  const projectId = currentProject?.id || ''
  
  const { 
    shots, 
    isGenerating, 
    generateFrames, 
    regenerateFrame,
    updateMotionPrompt,
    confirmStoryboard 
  } = useStoryboard(projectId)
  
  const [activeIndex, setActiveIndex] = useState(0)
  const [aiEditMode, setAiEditMode] = useState<'start' | 'end' | 'motion' | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [editPromptMode, setEditPromptMode] = useState<'start' | 'end' | 'motion' | null>(null)
  const [editPromptValue, setEditPromptValue] = useState('')
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  const activeShot = shots[activeIndex]

  // Generate frames on first load if none exist
  useEffect(() => {
    if (projectId && shots.length > 0 && isInitialLoad) {
      const hasFrames = shots.some(s => s.start_frame?.url)
      if (!hasFrames) {
        setIsInitialLoad(false)
        generateFrames()
      }
    }
  }, [projectId, shots, isInitialLoad, generateFrames])

  const handlePrevShot = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1)
  }

  const handleNextShot = () => {
    if (activeIndex < shots.length - 1) setActiveIndex(activeIndex + 1)
  }

  const handleRegenerateFrame = async (frameType: 'start' | 'end') => {
    if (!activeShot) return
    const frame = frameType === 'start' ? activeShot.start_frame : activeShot.end_frame
    if (frame) {
      await regenerateFrame(frame.id)
    }
  }

  const handleAiEditFrame = async (frameType: 'start' | 'end') => {
    if (!activeShot || !aiPrompt.trim()) return
    const frame = frameType === 'start' ? activeShot.start_frame : activeShot.end_frame
    if (frame) {
      await regenerateFrame(frame.id, aiPrompt)
      setAiPrompt('')
      setAiEditMode(null)
    }
  }

  const handleUpdateMotionPrompt = async () => {
    if (!activeShot || !editPromptValue.trim()) return
    await updateMotionPrompt(activeShot.id, editPromptValue)
    setEditPromptValue('')
    setEditPromptMode(null)
  }

  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    toast({ title: 'Prompt copied' })
  }

  const handleConfirm = async () => {
    await confirmStoryboard()
  }

  if (isGenerating && shots.every(s => !s.start_frame?.url)) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <h3 className="text-xl font-semibold">Generating Storyboard...</h3>
        <p className="text-muted-foreground mt-2">AI is creating visual frames for each shot</p>
      </div>
    )
  }

  if (!activeShot) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Film className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <h3 className="text-xl font-semibold">No Shots Found</h3>
        <p className="text-muted-foreground mt-2">Please generate a storyline first</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="Storyboard Editor"
        subtitle={`Shot ${activeIndex + 1} of ${shots.length}: ${activeShot.title}`}
        rightActions={
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handlePrevShot} 
              disabled={activeIndex === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleNextShot} 
              disabled={activeIndex === shots.length - 1}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-6 bg-white/40 dark:bg-black/20 transition-colors">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Shot Info */}
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">{activeShot.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">{activeShot.description}</p>
          </div>

          {/* Frames Side by Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Frame */}
            <GlassCard className="p-4 group">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Start Frame
              </h3>
              
              <div className={cn(
                "aspect-video bg-gradient-to-br rounded-lg flex items-center justify-center relative overflow-hidden",
                getGradientFromId(activeShot.id + 'start')
              )}>
                {activeShot.start_frame?.url ? (
                  <img 
                    src={activeShot.start_frame.url} 
                    alt="Start frame" 
                    className="w-full h-full object-cover"
                  />
                ) : activeShot.start_frame?.status === 'generating' ? (
                  <Loader2 className="w-12 h-12 animate-spin text-white/50" />
                ) : (
                  <ImageIcon className="w-16 h-16 text-white/30" />
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <p className="text-white/80 text-sm mb-3 line-clamp-2">
                    {activeShot.start_frame?.prompt || 'No prompt'}
                  </p>
                  
                  {aiEditMode === 'start' ? (
                    <div className="flex gap-2">
                      <Input
                        autoFocus
                        className="bg-white/10 border-white/20 text-white h-9 text-sm placeholder:text-white/50 flex-1"
                        placeholder="Describe refinements..."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAiEditFrame('start')}
                      />
                      <Button size="sm" className="h-9" onClick={() => handleAiEditFrame('start')} disabled={isGenerating}>
                        <Wand2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-9 text-white/70" onClick={() => setAiEditMode(null)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => handleRegenerateFrame('start')} disabled={isGenerating}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Regen
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setAiEditMode('start')}>
                        <Wand2 className="w-4 h-4 mr-1" />
                        AI Edit
                      </Button>
                      <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => handleCopyPrompt(activeShot.start_frame?.prompt || '')}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>

            {/* End Frame */}
            <GlassCard className="p-4 group">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                End Frame
              </h3>
              
              <div className={cn(
                "aspect-video bg-gradient-to-br rounded-lg flex items-center justify-center relative overflow-hidden",
                getGradientFromId(activeShot.id + 'end')
              )}>
                {activeShot.end_frame?.url ? (
                  <img 
                    src={activeShot.end_frame.url} 
                    alt="End frame" 
                    className="w-full h-full object-cover"
                  />
                ) : activeShot.end_frame?.status === 'generating' ? (
                  <Loader2 className="w-12 h-12 animate-spin text-white/50" />
                ) : (
                  <div className="text-center">
                    <Plus className="w-12 h-12 text-white/30 mx-auto mb-2" />
                    <span className="text-white/50 text-sm">Optional</span>
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  {activeShot.end_frame ? (
                    <>
                      <p className="text-white/80 text-sm mb-3 line-clamp-2">
                        {activeShot.end_frame.prompt}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => handleRegenerateFrame('end')} disabled={isGenerating}>
                          <RefreshCw className="w-4 h-4 mr-1" />
                          Regen
                        </Button>
                        <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={() => setAiEditMode('end')}>
                          <Wand2 className="w-4 h-4 mr-1" />
                          AI Edit
                        </Button>
                      </div>
                    </>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => toast({ title: 'Coming soon' })}>
                      <Plus className="w-4 h-4 mr-1" />
                      Generate End Frame
                    </Button>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Motion/Video Direction */}
          <GlassCard className="p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-purple-500" />
                <h3 className="text-sm font-semibold">Video Direction</h3>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => {
                  setEditPromptMode('motion')
                  setEditPromptValue(activeShot.motion_prompt?.prompt || '')
                }}>
                  <Pencil className="w-4 h-4 mr-1" />
                  Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleCopyPrompt(activeShot.motion_prompt?.prompt || '')}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {editPromptMode === 'motion' ? (
              <div className="space-y-3">
                <Textarea
                  value={editPromptValue}
                  onChange={(e) => setEditPromptValue(e.target.value)}
                  className="min-h-[100px] bg-white/80 dark:bg-black/40"
                  placeholder="Describe the camera motion and animation..."
                />
                <div className="flex gap-2">
                  <GradientButton size="sm" onClick={handleUpdateMotionPrompt}>
                    Save
                  </GradientButton>
                  <Button size="sm" variant="ghost" onClick={() => setEditPromptMode(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-foreground/80 leading-relaxed">
                {activeShot.motion_prompt?.prompt || 'No motion prompt generated yet'}
              </p>
            )}
          </GlassCard>

          {/* Shot Thumbnails */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {shots.map((shot, idx) => (
              <button
                key={shot.id}
                onClick={() => setActiveIndex(idx)}
                className={cn(
                  "flex-shrink-0 w-24 rounded-lg overflow-hidden border-2 transition-all",
                  idx === activeIndex 
                    ? "border-purple-500 scale-105" 
                    : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <div className={cn(
                  "aspect-video bg-gradient-to-br flex items-center justify-center",
                  getGradientFromId(shot.id)
                )}>
                  {shot.start_frame?.url ? (
                    <img src={shot.start_frame.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-lg">{idx + 1}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="border-t border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-sm p-4 transition-colors">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => generateFrames()}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Regenerate All Frames
          </Button>
          
          <GradientButton 
            onClick={handleConfirm}
            disabled={isGenerating}
            className="gap-2"
          >
            Generate Videos
            <ArrowRight className="w-4 h-4" />
          </GradientButton>
        </div>
      </div>
    </div>
  )
}
