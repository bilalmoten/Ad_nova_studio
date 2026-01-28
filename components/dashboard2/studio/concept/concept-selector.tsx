'use client'

import { useState, useEffect } from 'react'
import { useStudioStore } from '@/lib/dashboard2/store'
import { useConcepts } from '@/lib/dashboard2/hooks'
import { StepHeader } from '../step-header'
import { GlassCard } from '../../ui/glass-card'
import { Button } from '@/components/ui/button'
import { RefreshCw, Loader2, Sparkles, Check, ArrowRight, Wand2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { getGradientFromId } from '@/lib/dashboard2/utils'
import { GradientButton } from '../../ui/gradient-button'
import { Textarea } from '@/components/ui/textarea'

export function ConceptSelector() {
  const { currentProject } = useStudioStore()
  const { toast } = useToast()
  const projectId = currentProject?.id || ''
  
  const { concepts, isGenerating, generate, select } = useConcepts(projectId)
  
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [aiInstructions, setAiInstructions] = useState('')
  const [showAiInput, setShowAiInput] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Generate concepts on first load if none exist
  useEffect(() => {
    if (projectId && concepts.length === 0 && isInitialLoad) {
      setIsInitialLoad(false)
      generate()
    }
  }, [projectId, concepts.length, isInitialLoad, generate])

  // Set selected if project already has one
  useEffect(() => {
    if (currentProject?.selected_concept) {
      setSelectedId(currentProject.selected_concept.id)
    }
  }, [currentProject?.selected_concept])
  
  const handleSelect = (id: string) => {
    setSelectedId(id)
  }
  
  const handleConfirmSelection = async () => {
    if (!selectedId) return
    await select(selectedId)
  }

  const handleRegenerateAll = async () => {
    setSelectedId(null)
    await generate()
  }

  const handleAiRefine = async () => {
    if (!aiInstructions.trim()) return
    setSelectedId(null)
    await generate(aiInstructions)
    setAiInstructions('')
    setShowAiInput(false)
  }

  if (isGenerating && concepts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <h3 className="text-xl font-semibold">Generating Concepts...</h3>
        <p className="text-muted-foreground mt-2">AI is creating creative directions for your video</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="Choose Concept"
        subtitle="Select a creative direction for your video"
      />

      <div className="flex-1 overflow-y-auto p-6 bg-white/40 dark:bg-black/20 transition-colors">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {concepts.map((concept) => {
            const isSelected = selectedId === concept.id
            
            return (
              <GlassCard
                key={concept.id}
                className={cn(
                  "relative flex flex-col transition-all duration-300 border-2 overflow-hidden cursor-pointer",
                  isSelected 
                    ? "border-purple-500 bg-purple-500/5 shadow-2xl shadow-purple-500/10 scale-[1.02]" 
                    : "border-transparent hover:border-purple-500/20 hover:scale-[1.01]"
                )}
                onClick={() => handleSelect(concept.id)}
              >
                {/* Selection Indicator */}
                <div className={cn(
                  "absolute top-3 right-3 w-7 h-7 rounded-full border-2 flex items-center justify-center z-10 transition-all",
                  isSelected 
                    ? "border-purple-500 bg-purple-500 text-white shadow-lg shadow-purple-500/30" 
                    : "border-white/20 bg-black/30 backdrop-blur-sm"
                )}>
                  {isSelected && <Check className="w-4 h-4" />}
                </div>

                {/* Hero Image */}
                <div className={cn(
                  "h-48 w-full bg-gradient-to-br flex items-center justify-center flex-shrink-0 relative overflow-hidden",
                  getGradientFromId(concept.id)
                )}>
                  <Sparkles className="w-12 h-12 text-white/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold mb-2">{concept.name}</h3>
                  <p className="text-xs font-semibold text-purple-500 dark:text-purple-400 mb-4 uppercase tracking-wide">
                    {concept.tagline}
                  </p>
                  
                  <p className="text-sm text-foreground/70 mb-5 line-clamp-3 flex-1 leading-relaxed">
                    {concept.description}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-4 border-t border-black/5 dark:border-white/5">
                     <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">Style:</span>
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {concept.visual_style}
                        </span>
                     </div>
                     <span className="text-muted-foreground">{concept.pacing}</span>
                  </div>
                </div>
              </GlassCard>
            )
          })}
        </div>
      </div>

      {/* Fixed Footer with Actions */}
      <div className="border-t border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-sm p-4 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          {/* AI Instructions Input */}
          {showAiInput && (
            <div className="flex gap-3 items-start">
              <Textarea
                placeholder="Describe how you want to modify these concepts... (e.g., 'Make them more vibrant and energetic')"
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
              disabled={!selectedId || isGenerating} 
              onClick={handleConfirmSelection}
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
