"use client"

import { useState, useMemo } from 'react'
import { useStudioStore } from '@/lib/studio/store'
import { generateV2Video } from '@/server/actions/studio/v2-generate'
import { GlassCard } from '@/components/ui/glass-card'
import { GradientButton } from '@/components/ui/gradient-button'
import { useToast } from '@/hooks/use-toast'
import { cn, getGradientFromId } from '@/lib/utils'
import { 
  Play, 
  RotateCcw, 
  Loader2, 
  Film, 
  Download, 
  Coins,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export function VideoGenerationView() {
  const { 
    projectId, 
    shots, 
    assets, 
    addAsset, 
    updateAsset, 
    setError,
    isGenerating,
    setIsGenerating
  } = useStudioStore()
  
  const { toast } = useToast()
  
  const [activeShotId, setActiveShotId] = useState<string | null>(null)
  
  // Computed: Map shots to their video assets
  const shotData = useMemo(() => {
    return shots.map(shot => {
      // Find the video asset linked to this shot
      // We look for the latest video asset for this shot
      const videoAsset = assets
        .filter(a => a.type === 'video' && (a.metadata as any)?.shot_id === shot.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        
      // Find the start frame (image) for this shot (usually from storyboard)
      const startFrameAsset = assets
        .filter(a => a.type === 'image' && (a.metadata as any)?.shot_id === shot.id)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
        
      return {
        ...shot,
        video: videoAsset,
        startFrame: startFrameAsset
      }
    })
  }, [shots, assets])
  
  const activeItem = useMemo(() => 
    shotData.find(s => s.id === activeShotId) || shotData[0],
  [shotData, activeShotId])

  // Actions
  const handleGenerateShot = async (shotId: string) => {
    if (!projectId) return
    
    // Find inputs
    const item = shotData.find(s => s.id === shotId)
    if (!item) return
    
    setIsGenerating(true)
    
    try {
      toast({ title: "Starting Generation", description: `Generating video for ${item.title}...` })
      
      const result = await generateV2Video(projectId, {
        prompt: item.description || item.title, // Use description if available, else title
        image_url: item.startFrame?.media_url || undefined,
        duration: 4, // Default to 4s
        shot_id: shotId,
        model: 'sora-2' // Default to best model
      })
      
      if (result.error) {
        setError(result.error)
        toast({ title: "Generation Failed", description: result.error, variant: "destructive" })
      } else if (result.data) {
        addAsset(result.data)
        toast({ title: "Generation Started", description: "Video is processing..." })
      }
    } catch (err) {
       console.error(err)
       setError('Unexpected error during generation')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateAll = async () => {
    if (!projectId) return
    setIsGenerating(true)
    toast({ title: "Batch Generation", description: `Queuing ${shotData.filter(s => !s.video).length} shots...` })
    
    // Sequence them to avoid overwhelming server/rate limits
    // In a real app, this should be a bulk backend action
    // For now, we iterate client-side
    
    for (const item of shotData) {
        if (!item.video) {
            await handleGenerateShot(item.id)
        }
    }
    
    setIsGenerating(false)
  }

  const handleDownload = (url: string) => {
    window.open(url, '_blank')
  }

  if (shots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-zinc-500">
        <Film className="w-16 h-16 mb-4 opacity-20" />
        <h3 className="text-xl font-semibold text-zinc-300">No Shots Found</h3>
        <p className="mt-2">Generate a script breakdown or add shots to start.</p>
      </div>
    )
  }

  return (
    <div className="flex h-full overflow-hidden">
      
      {/* SIDEBAR: Shot List */}
      <div className="w-80 border-r border-zinc-800/50 bg-zinc-900/30 flex flex-col">
          <div className="p-4 border-b border-zinc-800/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">TIMELINE</h3>
              <span className="text-xs text-zinc-600 font-mono">
                  {shotData.filter(s => s.video?.status === 'ready').length}/{shotData.length} READY
              </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {shotData.map((item, idx) => (
                  <div 
                      key={item.id}
                      onClick={() => setActiveShotId(item.id)}
                      className={cn(
                          "relative rounded-lg p-2 cursor-pointer border transition-all hover:bg-zinc-800/50",
                          activeItem?.id === item.id 
                            ? "bg-zinc-800 border-zinc-700 ring-1 ring-[#c084fc]/30" 
                            : "border-transparent"
                      )}
                  >
                      <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className={cn(
                              "w-16 h-10 rounded overflow-hidden flex-shrink-0 bg-black relative",
                              getGradientFromId(item.id)
                          )}>
                             {(item.video?.media_url || item.startFrame?.media_url) ? (
                                 <img 
                                    src={item.video?.media_url || item.startFrame?.media_url} 
                                    className="w-full h-full object-cover" 
                                    alt=""
                                 />
                             ) : (
                                 <div className="w-full h-full flex items-center justify-center text-white/20">
                                     <Film size={12} />
                                 </div>
                             )}
                             
                             {/* Status Badge */}
                             <div className="absolute inset-0 flex items-center justify-center">
                                 {item.video?.status === 'processing' && <Loader2 className="w-4 h-4 text-[#c084fc] animate-spin" />}
                                 {item.video?.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                                 {item.video?.status === 'ready' && <Play className="w-4 h-4 text-white/80 fill-white/80" />}
                             </div>
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                              <div className="flex justify-between mb-0.5">
                                  <span className="text-[10px] font-bold text-zinc-500">SHOT {idx + 1}</span>
                                  <span className="text-[10px] font-mono text-zinc-600">4s</span>
                              </div>
                              <div className="text-xs font-medium text-zinc-300 truncate">{item.title}</div>
                          </div>
                      </div>
                      
                      {/* Progress Bar */}
                      {item.video?.status === 'processing' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#c084fc] animate-pulse rounded-b-lg" />
                      )}
                  </div>
              ))}
          </div>
          
          <div className="p-4 border-t border-zinc-800/50 bg-zinc-900/50">
              <GradientButton 
                  onClick={handleGenerateAll}
                  disabled={isGenerating}
                  className="w-full py-4"
              >
                  {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4 fill-current" />}
                  Generate All ({shotData.filter(s => !s.video).length})
              </GradientButton>
          </div>
      </div>

      {/* MAIN: Preview Area */}
      <div className="flex-1 flex flex-col bg-zinc-950 relative">
          {activeItem ? (
              <div className="flex-1 flex flex-col p-8 items-center justify-center">
                  
                  {/* Header */}
                  <div className="w-full max-w-4xl mb-6 flex items-start justify-between">
                      <div>
                          <h2 className="text-2xl font-bold text-white mb-2">{activeItem.title}</h2>
                          <p className="text-zinc-400 max-w-2xl">{activeItem.description || "No description provided."}</p>
                      </div>
                      <div className="flex gap-2">
                           {activeItem.video?.status === 'ready' && (
                               <Button variant="outline" size="sm" onClick={() => handleDownload(activeItem.video!.media_url!)}>
                                   <Download className="mr-2 h-4 w-4" /> Download
                               </Button>
                           )}
                           <Button 
                                variant={activeItem.video ? "secondary" : "default"} 
                                onClick={() => handleGenerateShot(activeItem.id)}
                                disabled={isGenerating}
                           >
                               <RotateCcw className={cn("mr-2 h-4 w-4", isGenerating && "animate-spin")} />
                               {activeItem.video ? "Regenerate" : "Generate Shot"}
                           </Button>
                      </div>
                  </div>

                  {/* Player */}
                  <GlassCard className="w-full max-w-4xl aspect-video relative overflow-hidden flex items-center justify-center bg-black group">
                      {activeItem.video?.media_url ? (
                          <video 
                              src={activeItem.video.media_url} 
                              controls 
                              autoPlay 
                              className="w-full h-full object-contain"
                              loop
                          />
                      ) : activeItem.video?.status === 'processing' ? (
                          <div className="flex flex-col items-center">
                              <div className="w-16 h-16 rounded-full border-4 border-[#c084fc] border-t-transparent animate-spin mb-4" />
                              <p className="text-zinc-400 animate-pulse">Generating your masterpiece...</p>
                          </div>
                      ) : activeItem.video?.status === 'failed' ? (
                          <div className="text-red-400 flex flex-col items-center">
                              <AlertCircle size={48} className="mb-4" />
                              <p>Generation Failed</p>
                              <p className="text-sm opacity-70 mt-2">{activeItem.video.error_message}</p>
                          </div>
                      ) : activeItem.startFrame?.media_url ? (
                          <>
                              <img src={activeItem.startFrame.media_url} className="w-full h-full object-contain opacity-50 blur-sm" alt="Reference" />
                              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                                  <Play className="w-20 h-20 text-white/80 opacity-80 mb-4" />
                                  <p className="text-zinc-300">Ready to animate</p>
                              </div>
                          </>
                      ) : (
                          <div className="flex flex-col items-center text-zinc-600">
                              <Film size={48} className="mb-4 opacity-50" />
                              <p>No video or reference image</p>
                          </div>
                      )}
                  </GlassCard>
                  
                  {/* Metadata */}
                  {activeItem.video && (
                      <div className="w-full max-w-4xl mt-6 grid grid-cols-3 gap-4">
                          <DataCard label="Model" value={activeItem.video.metadata.model || "Sora-2"} />
                          <DataCard label="Duration" value={`${activeItem.video.metadata.duration_seconds || 4}s`} />
                          <DataCard label="Dimensions" value="1280x720" />
                      </div>
                  )}

              </div>
          ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                  Select a shot to preview
              </div>
          )}
      </div>

    </div>
  )
}

function DataCard({ label, value }: { label: string, value: string }) {
    return (
        <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 text-center">
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-zinc-300 font-mono text-sm">{value}</div>
        </div>
    )
}
