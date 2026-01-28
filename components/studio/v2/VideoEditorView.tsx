"use client"

import { useState, useRef, useEffect, useMemo } from 'react'
import { useStudioStore } from '@/lib/studio/store'
import { GlassCard } from '@/components/ui/glass-card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn, getGradientFromId } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import jsZip from 'jszip'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download, 
  Film,
  Scissors
} from 'lucide-react'

// Helper to format seconds to MM:SS
const formatTime = (seconds: number) => {
  const min = Math.floor(seconds / 60)
  const sec = Math.floor(seconds % 60)
  return `${min}:${sec.toString().padStart(2, '0')}`
}

export function VideoEditorView() {
  const { projectId, shots, assets } = useStudioStore()
  const { toast } = useToast()
  
  const videoRef = useRef<HTMLVideoElement>(null)
  
  // State
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [currentClipIndex, setCurrentClipIndex] = useState(0)
  const [showExportModal, setShowExportModal] = useState(false)

  // Computed: Get actionable clips from shots -> assets
  const clips = useMemo(() => {
    return shots
        .map(shot => {
             // Find video asset for this shot
             const video = assets
                .filter(a => a.type === 'video' && (a.metadata as any)?.shot_id === shot.id && a.status === 'ready')
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
             
             return {
                 id: shot.id,
                 title: shot.title,
                 video
             }
        })
        .filter(clip => clip.video && clip.video.media_url) // Only show ready clips
  }, [shots, assets])

  const totalDuration = useMemo(() => {
      return clips.reduce((acc, clip) => acc + ((clip.video?.metadata as any)?.duration_seconds || 4), 0)
  }, [clips])

  // Current active clip
  const currentClip = clips[currentClipIndex]
  
  // Playback Logic
  const togglePlayback = () => {
    if (videoRef.current) {
        if (isPlaying) {
            videoRef.current.pause()
        } else {
            videoRef.current.play()
        }
        setIsPlaying(!isPlaying)
    }
  }

  // Handle video end (auto-advance)
  const handleVideoEnded = () => {
      if (currentClipIndex < clips.length - 1) {
          setCurrentClipIndex(prev => prev + 1)
          // Small timeout to allow render
          setTimeout(() => {
              if (videoRef.current) videoRef.current.play()
          }, 100)
      } else {
          setIsPlaying(false)
          setCurrentClipIndex(0)
      }
  }

  // Effect to sync play state when clip changes manually
  useEffect(() => {
      if (isPlaying && videoRef.current) {
          videoRef.current.play().catch(() => setIsPlaying(false))
      }
  }, [currentClipIndex])

  // Export Logic
  const handleExportZip = async () => {
      if (clips.length === 0) return
      
      const zip = new jsZip()
      const folder = zip.folder(`project-${projectId}-videos`)
      
      toast({ title: "Optimizing", description: "Preparing files for download..." })
      
      try {
          // Fetch all videos
          const promises = clips.map(async (clip, idx) => {
              if (!clip.video?.media_url) return
              const response = await fetch(clip.video.media_url)
              const blob = await response.blob()
              const filename = `shot_${idx+1}_${clip.title.replace(/[^a-z0-9]/gi, '_')}.mp4`
              folder?.file(filename, blob)
          })
          
          await Promise.all(promises)
          
          const content = await zip.generateAsync({ type: 'blob' })
          const url = URL.createObjectURL(content)
          
          const a = document.createElement('a')
          a.href = url
          a.download = `project-${projectId}-export.zip`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
          
          setShowExportModal(false)
          toast({ title: "Complete", description: "Your download should start shortly." })
          
      } catch (err) {
          console.error(err)
          toast({ title: "Export Failed", description: "Something went wrong.", variant: "destructive" })
      }
  }

  if (clips.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-12 text-zinc-500">
          <Film className="w-16 h-16 mb-4 opacity-20" />
          <h3 className="text-xl font-semibold text-zinc-300">No Videos Ready</h3>
          <p className="mt-2">Generate videos in the previous step to edit them here.</p>
        </div>
      )
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-zinc-950">
        
        {/* PREVIEW AREA */}
        <div className="flex-1 flex items-center justify-center p-8 bg-black relative">
            <div className="relative w-full max-w-5xl aspect-video bg-zinc-900 rounded-lg overflow-hidden shadow-2xl border border-zinc-800">
                {currentClip ? (
                    <video
                        ref={videoRef}
                        src={currentClip.video!.media_url!}
                        className="w-full h-full object-contain"
                        onEnded={handleVideoEnded}
                        onClick={togglePlayback}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500">
                        Select a clip
                    </div>
                )}
                
                {/* Play Overlay */}
                {!isPlaying && (
                    <div 
                        className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/10 transition-colors cursor-pointer group"
                        onClick={togglePlayback}
                    >
                        <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-white fill-white" />
                        </div>
                    </div>
                )}
                
                {/* Info Overlay */}
                <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1.5 rounded text-white text-xs font-medium">
                    {currentClipIndex + 1} / {clips.length} • {currentClip?.title}
                </div>
            </div>
        </div>

        {/* TIMELINE AREA */}
        <div className="h-72 border-t border-zinc-800 bg-zinc-900/50 flex flex-col">
            
            {/* Toolbar */}
            <div className="h-12 border-b border-zinc-800 flex items-center justify-between px-4 bg-zinc-900">
                 <div className="flex items-center gap-4">
                     <Button variant="ghost" size="icon" onClick={() => setCurrentClipIndex(Math.max(0, currentClipIndex - 1))}>
                         <SkipBack size={16} />
                     </Button>
                     <Button variant="ghost" size="icon" onClick={togglePlayback}>
                         {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => setCurrentClipIndex(Math.min(clips.length - 1, currentClipIndex + 1))}>
                         <SkipForward size={16} />
                     </Button>
                     <span className="text-xs font-mono text-zinc-500 ml-2">
                         {formatTime(currentTime)} / {formatTime(totalDuration)}
                     </span>
                 </div>
                 
                 <Button onClick={() => setShowExportModal(true)} size="sm" className="gap-2 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0 text-white">
                     <Download size={14} /> Export Project
                 </Button>
            </div>

            {/* Tracks */}
            <div className="flex-1 p-4 overflow-x-auto">
                 <div className="min-w-full flex gap-1 h-32 items-center">
                      {clips.map((clip, idx) => (
                          <div 
                              key={clip.id}
                              onClick={() => { setCurrentClipIndex(idx); setIsPlaying(false); }}
                              className={cn(
                                  "h-24 flex-shrink-0 relative rounded cursor-pointer overflow-hidden border-2 transition-all group",
                                  idx === currentClipIndex 
                                    ? "border-[#a3e635] ring-2 ring-[#a3e635]/20 w-48" // Active is wider
                                    : "border-transparent opacity-60 hover:opacity-100 hover:border-zinc-600 w-32"
                              )}
                          >
                              {/* Thumb */}
                              <div className={cn("absolute inset-0 bg-zinc-800", getGradientFromId(clip.id))}>
                                  {clip.video?.media_url && (
                                     <img src={clip.video.media_url} className="w-full h-full object-cover opacity-50" alt="" />
                                  )}
                              </div>
                              
                              {/* Label */}
                              <div className="absolute bottom-0 left-0 right-0 p-1.5 bg-black/60 backdrop-blur-sm truncate">
                                  <div className="text-[10px] font-bold text-white truncate">{clip.title}</div>
                                  <div className="text-[9px] text-zinc-400 font-mono">{(clip.video?.metadata as any)?.duration_seconds || 4}s</div>
                              </div>
                              
                              {/* Number */}
                              <div className="absolute top-1 left-1 w-5 h-5 rounded bg-black/50 text-[10px] flex items-center justify-center text-white font-mono border border-white/10">
                                  {idx + 1}
                              </div>
                          </div>
                      ))}
                      
                      {/* Empty State / Add more */}
                      <div className="h-24 w-24 rounded border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-700 ml-4">
                          <span className="text-xs">End</span>
                      </div>
                 </div>
            </div>

        </div>

        {/* Modal */}
        {showExportModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <GlassCard className="w-full max-w-md p-6">
                    <h3 className="text-lg font-bold text-white mb-2">Export Project</h3>
                    <p className="text-sm text-zinc-400 mb-6">Download all {clips.length} clips as a ZIP archive.</p>
                    
                    <div className="flex gap-3">
                        <Button variant="outline" className="flex-1" onClick={() => setShowExportModal(false)}>Cancel</Button>
                        <Button className="flex-1 bg-[#a3e635] text-black hover:bg-[#8fd12a]" onClick={handleExportZip}>Download ZIP</Button>
                    </div>
                </GlassCard>
            </div>
        )}

    </div>
  )
}
