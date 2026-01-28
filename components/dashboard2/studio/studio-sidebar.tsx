'use client'

import { useStudioStore } from '@/lib/dashboard2/store'
import { WorkflowStep } from '@/lib/studio/types'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getGradientFromId } from '@/lib/dashboard2/utils'

const STEPS: { key: WorkflowStep; label: string; order: number }[] = [
  { key: 'concept', label: 'Concept', order: 1 },
  { key: 'storyline', label: 'Storyline', order: 2 },
  { key: 'hero-image', label: 'Hero Image', order: 3 },
  { key: 'storyboard', label: 'Storyboard', order: 4 },
  { key: 'generation', label: 'Video Gen', order: 5 },
  { key: 'editor', label: 'Edit & Export', order: 6 },
]

export function StudioSidebar() {
  const { currentProject, currentStep, goToStep, shots, heroImages } = useStudioStore()
  
  if (!currentProject) return null
  
  const currentStepIndex = STEPS.findIndex(s => s.key === currentStep)
  
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed'
    if (stepIndex === currentStepIndex) return 'active'
    return 'locked'
  }
  
  const canNavigate = (stepIndex: number) => {
    return stepIndex <= currentStepIndex
  }
  
  return (
    <div className="w-80 border-r border-white/10 bg-white/5 backdrop-blur-md p-6 flex flex-col">
      {/* Project name */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-1 line-clamp-2">{currentProject.name}</h2>
        <p className="text-xs text-muted-foreground">
          {currentProject.aspect_ratio} • {currentProject.shot_count} shots
        </p>
      </div>
      
      {/* Workflow steps */}
      <div className="flex-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
          Workflow Steps
        </h3>
        
        <div className="space-y-2">
          {STEPS.map((step, index) => {
            const status = getStepStatus(index)
            const isClickable = canNavigate(index)
            
            return (
              <button
                key={step.key}
                onClick={() => isClickable && goToStep(step.key)}
                disabled={!isClickable}
                className={cn(
                  'w-full flex items-start gap-3 p-3 rounded-lg transition-all text-left',
                  status === 'active' && 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30',
                  status === 'completed' && 'hover:bg-white/5 cursor-pointer',
                  status === 'locked' && 'opacity-40 cursor-not-allowed'
                )}
              >
                {/* Icon */}
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5',
                  status === 'completed' && 'bg-purple-500',
                  status === 'active' && 'bg-gradient-to-br from-purple-500 to-pink-500',
                  status === 'locked' && 'bg-white/10'
                )}>
                  {status === 'completed' ? (
                    <Check className="w-4 h-4 text-white" />
                  ) : (
                    <span className="text-xs font-semibold text-white">{step.order}</span>
                  )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{step.label}</div>
                  
                  {/* Mini preview for completed steps */}
                  {status === 'completed' && (
                    <div className="mt-2">
                      {step.key === 'concept' && currentProject.selected_concept && (
                        <div className={cn(
                          'h-16 rounded bg-gradient-to-br flex items-center justify-center text-xs',
                          getGradientFromId(currentProject.selected_concept.id)
                        )}>
                          <span className="text-white/70">{currentProject.selected_concept.name}</span>
                        </div>
                      )}
                      
                      {step.key === 'storyline' && shots.length > 0 && (
                        <div className="text-xs text-muted-foreground">
                          {shots.length} shots defined
                        </div>
                      )}
                      
                      {step.key === 'hero-image' && heroImages.length > 0 && (
                        <div className="flex gap-1">
                          {heroImages.filter(img => img.is_selected).slice(0, 3).map(img => (
                            <div
                              key={img.id}
                              className={cn(
                                'w-12 h-12 rounded bg-gradient-to-br overflow-hidden',
                                getGradientFromId(img.id)
                              )}
                            >
                              {img.url && (
                                <img src={img.url} alt="" className="w-full h-full object-cover" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Footer actions */}
      <div className="mt-8 space-y-2">
        <button className="w-full px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm">
          Save Draft
        </button>
        <button className="w-full px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm text-muted-foreground">
          Exit Studio
        </button>
      </div>
    </div>
  )
}
