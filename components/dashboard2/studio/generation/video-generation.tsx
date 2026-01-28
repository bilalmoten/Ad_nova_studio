'use client'

import { useState, useEffect, useMemo } from 'react'
import { useStudioStore } from '@/lib/dashboard2/store'
import { useVideoGeneration, useWorkflowNavigation } from '@/lib/dashboard2/hooks'
import { StepHeader } from '../step-header'
import { GlassCard } from '../../ui/glass-card'
import { GradientButton } from '../../ui/gradient-button'
import { getGradientFromId } from '@/lib/dashboard2/utils'
import { Play, RotateCcw, Loader2, Film, Download, ArrowLeft, Coins } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { GENERATION_SETTINGS } from '@/lib/studio/prompts'

export function VideoGeneration() {
  const { currentProject } = useStudioStore()
  const { toast } = useToast()
  const projectId = currentProject?.id || ''
  
  const { 
    shots, 
    isGenerating, 
    progress,
    generateAll, 
    regenerateShot,
    finalize 
  } = useVideoGeneration(projectId)
  
  const { prevStep } = useWorkflowNavigation(projectId)
  
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null)
  
  // Credit estimation
  const shotCount = shots.length
  const estimatedCredits = shotCount * GENERATION_SETTINGS.video.creditsPerShot

  const activeShot = shots.find(s => s.id === activeVideoId) || shots[0]
  const allComplete = shots.length > 0 && shots.every(s => s.video?.status === 'completed')
  const hasFailed = shots.some(s => s.video?.status === 'failed')
  
  // Detect if video generation has been started (either ongoing or has videos)
  const hasExistingVideos = useMemo(() => {
    return shots.some(s => s.video && ['generating', 'completed', 'failed'].includes(s.video.status || ''))
  }, [shots])
  
  // Track if user clicked generate this session
  const [userClickedGenerate, setUserClickedGenerate] = useState(false)
  
  // Show generation UI if user clicked generate OR if videos already exist
  const shouldShowGenerationUI = userClickedGenerate || hasExistingVideos || isGenerating

  useEffect(() => {
    if (shots.length > 0 && !activeVideoId) {
      setActiveVideoId(shots[0].id)
    }
  }, [shots, activeVideoId])

  const handleStartGeneration = async () => {
    setUserClickedGenerate(true)
    await generateAll()
  }

  const handleBackToStoryboard = async () => {
    await prevStep()
  }

  const handleFinalize = async () => {
    await finalize()
  }

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeShot?.video?.url) {
      window.open(activeShot.video.download_url || activeShot.video.url, '_blank')
    }
    toast({ title: "Downloading Video", description: "Starting download..." })
  }

  // Pre-generation state - show "Ready to Generate" only if no videos exist yet
  if (!shouldShowGenerationUI) {
    return (
      <div className="flex flex-col h-full">
        <StepHeader
          title="Video Generation"
          subtitle="Ready to transform your storyboard into motion"
        />
        
        <div className="flex-1 flex items-center justify-center p-8 bg-white/40 dark:bg-black/20 transition-colors">
          <GlassCard className="p-8 max-w-lg w-full text-center space-y-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center">
              <Film className="w-10 h-10 text-purple-500" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-2">Ready to Generate</h2>
              <p className="text-muted-foreground">
                Your storyboard with {shotCount} shots is ready for video generation.
              </p>
            </div>

            {/* Credit Estimation */}
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center justify-center gap-3 text-amber-600 dark:text-amber-400">
                <Coins className="w-5 h-5" />
                <span className="font-semibold">Estimated Cost: {estimatedCredits} credits</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {shotCount} shots × {GENERATION_SETTINGS.video.creditsPerShot} credits per shot
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <GradientButton className="w-full py-6 text-lg" onClick={handleStartGeneration}>
                <Play className="w-5 h-5 mr-2" />
                Generate Video
              </GradientButton>
              
              <Button variant="outline" onClick={handleBackToStoryboard} className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Storyboard
              </Button>
            </div>
          </GlassCard>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="Video Generation"
        subtitle="AI is transforming your storyboard into motion"
        rightActions={
            <div className="flex items-center gap-4">
               {isGenerating && (
                   <div className="flex items-center gap-2 text-sm text-muted-foreground mr-4">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                        Generating... {progress.percent}%
                   </div>
               )}
               <GradientButton 
                    onClick={handleFinalize} 
                    disabled={!allComplete}
                >
                    Finalize & Export
                </GradientButton>
            </div>
        }
      />
      
      <div className="flex-1 flex overflow-hidden">
         {/* Left Sidebar: Generation List */}
         <div className="w-80 border-r border-white/10 bg-white/5 flex flex-col backdrop-blur-sm dark:bg-white/5 bg-white/40 dark:border-white/10 border-black/5 transition-colors">
            <div className="p-4 border-b border-black/5 dark:border-white/10 flex justify-between items-center">
               <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Shots</h3>
               <span className="text-xs text-muted-foreground">
                 {progress.completed}/{progress.total} Ready
               </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {shots.map((shot, idx) => {
                    const video = shot.video
                    const isActive = activeVideoId === shot.id
                    
                    return (
                        <div 
                           key={shot.id}
                           onClick={() => setActiveVideoId(shot.id)}
                           className={cn(
                               "flex items-center gap-3 p-2 rounded-lg cursor-pointer border transition-all relative overflow-hidden",
                               isActive 
                                 ? "bg-purple-500/10 border-purple-500/50 shadow-sm dark:shadow-none" 
                                 : "hover:bg-black/5 dark:hover:bg-white/5 border-transparent"
                            )}
                        >
                            {/* Status Indicator Bar */}
                            {video?.status === 'generating' && (
                                <div className="absolute bottom-0 left-0 h-0.5 bg-purple-500 animate-pulse w-full" />
                            )}
                            
                            {/* Thumbnail */}
                            <div className={cn(
                                "w-16 h-10 rounded bg-gradient-to-br flex-shrink-0 flex items-center justify-center relative overflow-hidden",
                                getGradientFromId(shot.id)
                            )}>
                                {shot.start_frame?.url && (
                                  <img src={shot.start_frame.url} alt="" className="w-full h-full object-cover" />
                                )}
                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                  {video?.status === 'generating' ? (
                                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                                  ) : video?.status === 'completed' ? (
                                      <Play className="w-4 h-4 text-white/80" />
                                  ) : video?.status === 'failed' ? (
                                      <span className="text-red-400 text-xs">!</span>
                                  ) : (
                                      <span className="text-white/50 text-xs">{idx + 1}</span>
                                  )}
                                </div>
                            </div>

                            <div className="min-w-0 flex-1">
                                <div className="text-xs font-bold text-muted-foreground mb-0.5 flex justify-between">
                                    <span>Shot {idx + 1}</span>
                                    <span className="font-normal opacity-50">
                                      {video?.duration_seconds || 5}s
                                    </span>
                                </div>
                                <div className="text-sm font-medium truncate">{shot.title}</div>
                            </div>
                        </div>
                    )
                })}
            </div>
         </div>

         {/* Right Workspace: Preview & Review */}
         <div className="flex-1 bg-white/30 dark:bg-black/20 p-8 flex flex-col items-center overflow-y-auto transition-colors">
            {activeShot ? (
               <div className="max-w-5xl w-full flex flex-col gap-6">
                  
                  {/* Text Header */}
                  <div className="flex items-start justify-between">
                     <div>
                         <h2 className="text-2xl font-bold mb-1">
                           Shot {shots.findIndex(s => s.id === activeShot.id) + 1}: {activeShot.title}
                         </h2>
                         <p className="text-muted-foreground">{activeShot.description}</p>
                     </div>
                     <div className="flex gap-2">
                       <Button variant="outline" size="sm" className="gap-2" onClick={handleBackToStoryboard}>
                          <ArrowLeft className="w-4 h-4" />
                          Back to Storyboard
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         className="gap-2"
                         disabled={isGenerating}
                         onClick={() => activeShot && regenerateShot(activeShot.id)}
                       >
                          <RotateCcw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
                          {isGenerating ? 'Regenerating...' : 'Regenerate Shot'}
                       </Button>
                     </div>
                  </div>

                  {/* Main Player */}
                  <GlassCard className="p-1 overflow-hidden flex-1 aspect-video w-full max-h-[60vh] mx-auto">
                     <div className={cn(
                        "w-full h-full bg-gradient-to-br rounded-lg relative flex items-center justify-center group overflow-hidden",
                        getGradientFromId(activeShot.id)
                     )}>
                         {activeShot.video?.status === 'generating' ? (
                             <div className="text-center">
                                 <Loader2 className="w-16 h-16 animate-spin text-white/50 mx-auto mb-4" />
                                 <p className="text-lg font-medium text-white/80">Generating Frame by Frame...</p>
                             </div>
                         ) : activeShot.video?.status === 'completed' && activeShot.video.url ? (
                             <>
                                <video 
                                  src={activeShot.video.url} 
                                  controls 
                                  className="w-full h-full object-contain"
                                  poster={activeShot.start_frame?.url || undefined}
                                />
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button 
                                      size="icon" 
                                      variant="secondary" 
                                      className="bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md" 
                                      onClick={handleDownload}
                                    >
                                        <Download className="w-5 h-5" />
                                    </Button>
                                </div>
                             </>
                         ) : activeShot.video?.status === 'failed' ? (
                             <div className="text-center">
                                 <span className="text-4xl mb-4 block">⚠️</span>
                                 <p className="text-lg font-medium text-white/80">Generation Failed</p>
                                 <p className="text-sm text-white/60 mt-2">{activeShot.video.error_message}</p>
                             </div>
                         ) : (
                             <>
                                {activeShot.start_frame?.url && (
                                  <img 
                                    src={activeShot.start_frame.url} 
                                    alt="" 
                                    className="w-full h-full object-cover opacity-50"
                                  />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <Play className="w-24 h-24 text-white/80 drop-shadow-2xl" />
                                </div>
                             </>
                         )}
                     </div>
                  </GlassCard>

                  {/* Credit Info */}
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Coins className="w-4 h-4 text-amber-500" />
                    <span>Project cost: {estimatedCredits} credits ({shotCount} shots)</span>
                  </div>

               </div>
            ) : (
                <div className="text-muted-foreground flex flex-col items-center my-auto">
                    <Film className="w-12 h-12 mb-4 opacity-20" />
                    <p>Select a shot to preview</p>
                </div>
            )}
         </div>
      </div>
    </div>
  )
}
