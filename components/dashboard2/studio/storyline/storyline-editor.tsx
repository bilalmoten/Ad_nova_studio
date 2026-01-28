'use client'

import { useState, useEffect } from 'react'
import { useStudioStore } from '@/lib/dashboard2/store'
import { useStoryline } from '@/lib/dashboard2/hooks'
import { StepHeader } from '../step-header'
import { GlassCard } from '../../ui/glass-card'
import { Button } from '@/components/ui/button'
import { GradientButton } from '../../ui/gradient-button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  GripVertical, 
  Trash2, 
  Plus, 
  RefreshCw, 
  ArrowRight, 
  Wand2,
  Loader2,
  Film
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { getGradientFromId } from '@/lib/dashboard2/utils'

export function StorylineEditor() {
  const { currentProject } = useStudioStore()
  const { toast } = useToast()
  const projectId = currentProject?.id || ''
  
  const { 
    shots, 
    isGenerating, 
    generate, 
    updateShot, 
    deleteShot, 
    confirmStoryline 
  } = useStoryline(projectId)
  
  const [aiInstructions, setAiInstructions] = useState('')
  const [showAiInput, setShowAiInput] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Generate storyline on first load if none exist
  useEffect(() => {
    if (projectId && shots.length === 0 && isInitialLoad && currentProject?.selected_concept) {
      setIsInitialLoad(false)
      generate()
    }
  }, [projectId, shots.length, isInitialLoad, currentProject?.selected_concept, generate])

  const handleRegenerateAll = async () => {
    await generate()
  }

  const handleAiRefine = async () => {
    if (!aiInstructions.trim()) return
    await generate(aiInstructions)
    setAiInstructions('')
    setShowAiInput(false)
  }

  const handleUpdateShot = (shotId: string, field: string, value: string) => {
    updateShot(shotId, { [field]: value })
  }

  const handleDeleteShot = async (shotId: string) => {
    if (shots.length <= 1) {
      toast({ title: 'Cannot delete', description: 'You need at least one shot', variant: 'destructive' })
      return
    }
    await deleteShot(shotId)
  }

  const handleConfirm = async () => {
    await confirmStoryline()
  }

  if (isGenerating && shots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <h3 className="text-xl font-semibold">Generating Storyline...</h3>
        <p className="text-muted-foreground mt-2">AI is creating your video's shot-by-shot narrative</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="Define Storyline"
        subtitle="Edit and arrange your video shots"
      />

      <div className="flex-1 overflow-y-auto p-6 bg-white/40 dark:bg-black/20 transition-colors">
        <div className="max-w-4xl mx-auto space-y-4">
          {shots.map((shot, index) => (
            <GlassCard
              key={shot.id}
              className="p-4 transition-all hover:shadow-lg"
            >
              <div className="flex gap-4">
                {/* Drag Handle & Number */}
                <div className="flex flex-col items-center gap-2 pt-2">
                  <GripVertical className="w-5 h-5 text-muted-foreground/50 cursor-grab" />
                  <div className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm",
                    getGradientFromId(shot.id)
                  )}>
                    {index + 1}
                  </div>
                </div>

                {/* Shot Content */}
                <div className="flex-1 space-y-3">
                  {/* Title */}
                  <Input
                    value={shot.title}
                    onChange={(e) => handleUpdateShot(shot.id, 'title', e.target.value)}
                    className="text-lg font-semibold bg-transparent border-none focus-visible:ring-1 focus-visible:ring-purple-500 px-0"
                    placeholder="Shot title..."
                  />

                  {/* Description */}
                  <Textarea
                    value={shot.description}
                    onChange={(e) => handleUpdateShot(shot.id, 'description', e.target.value)}
                    className="resize-none bg-white/50 dark:bg-black/30 min-h-[80px]"
                    placeholder="Visual description..."
                  />

                  {/* Voiceover/Action */}
                  <div className="flex items-start gap-2">
                    <Film className="w-4 h-4 text-muted-foreground mt-2.5" />
                    <Textarea
                      value={shot.voiceover_action || ''}
                      onChange={(e) => handleUpdateShot(shot.id, 'voiceover_action', e.target.value)}
                      className="resize-none bg-white/50 dark:bg-black/30 min-h-[60px] flex-1"
                      placeholder="Voiceover or action..."
                    />
                  </div>
                </div>

                {/* Delete Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 flex-shrink-0"
                  onClick={() => handleDeleteShot(shot.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </GlassCard>
          ))}

          {/* Add Shot Button */}
          <Button
            variant="outline"
            className="w-full h-16 border-dashed border-2 hover:border-purple-500/50 hover:bg-purple-500/5"
            onClick={() => toast({ title: 'Coming soon', description: 'Add shot functionality' })}
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Shot
          </Button>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="border-t border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-sm p-4 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          {/* AI Instructions Input */}
          {showAiInput && (
            <div className="flex gap-3 items-start">
              <Textarea
                placeholder="Describe changes to the storyline... (e.g., 'Add more emphasis on the product reveal')"
                className="flex-1 min-h-[80px] resize-none bg-white/80 dark:bg-black/40"
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
              />
              <div className="flex flex-col gap-2">
                <GradientButton 
                  onClick={handleAiRefine} 
                  disabled={!aiInstructions.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Wand2 className="w-4 h-4 mr-2" />
                  )}
                  Apply
                </GradientButton>
                <Button variant="ghost" size="sm" onClick={() => setShowAiInput(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleRegenerateAll}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Regenerate All
              </Button>
              {!showAiInput && (
                <Button variant="outline" onClick={() => setShowAiInput(true)}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  AI Instructions
                </Button>
              )}
            </div>
            
            <GradientButton 
              onClick={handleConfirm}
              disabled={shots.length === 0 || isGenerating}
              className="gap-2"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </GradientButton>
          </div>
        </div>
      </div>
    </div>
  )
}
