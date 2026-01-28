'use client'

import { useState, useRef, useEffect } from 'react'
import { useStudioStore } from '@/lib/dashboard2/store'
import { useVideoEditor, useWorkflowNavigation } from '@/lib/dashboard2/hooks'
import { StepHeader } from '../step-header'
import { GlassCard } from '../../ui/glass-card'
import { GradientButton } from '../../ui/gradient-button'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Download, 
  Scissors, 
  Gauge,
  GripVertical,
  Trash2,
  Check,
  Film,
  ChevronLeft
} from 'lucide-react'
import { getGradientFromId } from '@/lib/dashboard2/utils'
import { cn } from '@/lib/utils'

export function VideoEditor() {
  const { currentProject } = useStudioStore()
  const projectId = currentProject?.id || ''
  
  const { prevStep } = useWorkflowNavigation(projectId)
  
  const {
    clips,
    selectedClipId,
    clipSettings,
    isPlaying,
    currentTime,
    currentClipIndex,
    totalDuration,
    play,
    pause,
    togglePlayback,
    seekTo,
    nextClip,
    prevClip,
    selectClip,
    updateClipSettings,
    exportAsZip,
    downloadClip,
    formatTime,
  } = useVideoEditor(projectId)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [activePanel, setActivePanel] = useState<'trim' | 'speed' | null>(null)
  
  // Current clip data
  const currentClip = clips[currentClipIndex]
  const selectedClip = clips.find(c => c.id === selectedClipId)
  const selectedSettings = selectedClipId ? clipSettings[selectedClipId] : null
  
  // Handle video playback sync
  useEffect(() => {
    if (videoRef.current && currentClip?.video?.url) {
      if (isPlaying) {
        videoRef.current.play()
      } else {
        videoRef.current.pause()
      }
    }
  }, [isPlaying, currentClip])
  
  // Handle video ended - move to next clip
  const handleVideoEnded = () => {
    if (currentClipIndex < clips.length - 1) {
      nextClip()
    } else {
      pause()
    }
  }
  
  // Calculate clip start time on timeline
  const getClipStartTime = (index: number) => {
    let time = 0
    for (let i = 0; i < index; i++) {
      const shot = clips[i]
      const settings = clipSettings[shot.id]
      const baseDuration = shot.video?.duration_seconds || 6
      const trimmedDuration = baseDuration - (settings?.trimStart || 0) - (settings?.trimEnd || 0)
      time += trimmedDuration / (settings?.speed || 1)
    }
    return time
  }
  
  // Calculate clip duration for display
  const getClipDuration = (shot: typeof clips[0]) => {
    const settings = clipSettings[shot.id]
    const baseDuration = shot.video?.duration_seconds || 6
    const trimmedDuration = baseDuration - (settings?.trimStart || 0) - (settings?.trimEnd || 0)
    return trimmedDuration / (settings?.speed || 1)
  }
  
  // No clips state
  if (clips.length === 0) {
    return (
      <div className="flex flex-col h-full">
        <StepHeader
          title="Edit & Export"
          subtitle="No videos generated yet"
          rightActions={
            <Button variant="outline" onClick={() => prevStep()} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back to Generation
            </Button>
          }
        />
        <div className="flex-1 flex items-center justify-center bg-white/40 dark:bg-black/20">
          <GlassCard className="p-8 text-center">
            <Film className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h2 className="text-xl font-semibold mb-2">No Videos Yet</h2>
            <p className="text-muted-foreground mb-4">
              Generate videos first before editing
            </p>
            <Button onClick={() => prevStep()}>Go to Video Generation</Button>
          </GlassCard>
        </div>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="Edit & Export"
        subtitle={`${clips.length} clips • ${formatTime(totalDuration)} total`}
        rightActions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => prevStep()} className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
            <GradientButton onClick={() => setShowExportModal(true)} className="gap-2">
              <Download className="w-4 h-4" />
              Export
            </GradientButton>
          </div>
        }
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Video Preview */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-black/60 to-black/40 p-6">
          <div className="max-w-4xl w-full">
            <div className="aspect-video bg-black rounded-lg overflow-hidden relative shadow-2xl">
              {currentClip?.video?.url ? (
                <video
                  ref={videoRef}
                  key={currentClip.id}
                  src={currentClip.video.url}
                  className="w-full h-full object-contain"
                  onEnded={handleVideoEnded}
                  playsInline
                />
              ) : (
                <div className={cn(
                  "w-full h-full flex items-center justify-center bg-gradient-to-br",
                  getGradientFromId(currentClip?.id || 'default')
                )}>
                  <Film className="w-20 h-20 text-white/30" />
                </div>
              )}
              
              {/* Play button overlay */}
              <div 
                className="absolute inset-0 flex items-center justify-center cursor-pointer group"
                onClick={togglePlayback}
              >
                {!isPlaying && (
                  <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center 
                                  opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-10 h-10 text-white ml-1" />
                  </div>
                )}
              </div>
              
              {/* Current clip indicator */}
              <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                <span className="text-white text-sm font-medium">
                  {currentClip?.title || `Shot ${currentClipIndex + 1}`}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Playback Controls */}
        <div className="border-t border-white/10 bg-white/5 dark:bg-white/5 bg-white/60 px-6 py-3">
          <div className="flex items-center justify-center gap-4">
            <Button variant="ghost" size="icon" onClick={prevClip} disabled={currentClipIndex === 0}>
              <SkipBack className="w-5 h-5" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="w-12 h-12 rounded-full bg-purple-500/20 hover:bg-purple-500/30"
              onClick={togglePlayback}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </Button>
            
            <Button variant="ghost" size="icon" onClick={nextClip} disabled={currentClipIndex === clips.length - 1}>
              <SkipForward className="w-5 h-5" />
            </Button>
            
            <div className="ml-4 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-mono">{formatTime(currentTime)}</span>
              <span>/</span>
              <span className="font-mono">{formatTime(totalDuration)}</span>
            </div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="border-t border-white/10 bg-white/5 dark:bg-white/5 bg-white/60 p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div 
              className="h-1.5 bg-white/10 rounded-full cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect()
                const percent = (e.clientX - rect.left) / rect.width
                seekTo(percent * totalDuration)
              }}
            >
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                style={{ width: `${(currentTime / totalDuration) * 100}%` }}
              />
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
                style={{ left: `${(currentTime / totalDuration) * 100}%`, marginLeft: '-6px' }}
              />
            </div>
          </div>
          
          {/* Clips row */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {clips.map((shot, idx) => {
              const isSelected = selectedClipId === shot.id
              const isCurrent = currentClipIndex === idx
              const duration = getClipDuration(shot)
              const widthPercent = Math.max(60, (duration / totalDuration) * 100)
              
              return (
                <div
                  key={shot.id}
                  onClick={() => selectClip(shot.id)}
                  className={cn(
                    "flex-shrink-0 h-16 rounded-lg cursor-pointer transition-all relative overflow-hidden group",
                    "border-2",
                    isSelected 
                      ? "border-purple-500 ring-2 ring-purple-500/30" 
                      : isCurrent
                        ? "border-white/50"
                        : "border-transparent hover:border-white/30"
                  )}
                  style={{ width: `${widthPercent}px`, minWidth: '80px' }}
                >
                  {/* Thumbnail */}
                  <div className={cn(
                    "w-full h-full bg-gradient-to-br flex items-center justify-center",
                    getGradientFromId(shot.id)
                  )}>
                    {shot.start_frame?.url ? (
                      <img 
                        src={shot.start_frame.url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-white/70 text-sm font-bold">{idx + 1}</span>
                    )}
                  </div>
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent 
                                  flex flex-col justify-end p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-medium truncate">{shot.title}</span>
                    <span className="text-white/60 text-xs">{formatTime(duration)}</span>
                  </div>
                  
                  {/* Drag handle */}
                  <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <GripVertical className="w-3 h-3 text-white/50" />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        
        {/* Edit Panel */}
        {selectedClipId && (
          <div className="border-t border-white/10 bg-white/5 dark:bg-white/5 bg-white/60 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold">Editing: {selectedClip?.title}</h3>
                <div className="flex gap-1">
                  <Button 
                    variant={activePanel === 'trim' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'trim' ? null : 'trim')}
                    className="gap-1"
                  >
                    <Scissors className="w-4 h-4" />
                    Trim
                  </Button>
                  <Button 
                    variant={activePanel === 'speed' ? 'secondary' : 'ghost'} 
                    size="sm"
                    onClick={() => setActivePanel(activePanel === 'speed' ? null : 'speed')}
                    className="gap-1"
                  >
                    <Gauge className="w-4 h-4" />
                    Speed
                  </Button>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => downloadClip(selectedClipId)}
                  className="gap-1"
                >
                  <Download className="w-4 h-4" />
                  Download
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-red-500 hover:text-red-600 gap-1"
                  onClick={() => selectClip(null)}
                >
                  <Check className="w-4 h-4" />
                  Done
                </Button>
              </div>
            </div>
            
            {/* Trim Panel */}
            {activePanel === 'trim' && (
              <div className="bg-white/5 dark:bg-white/5 bg-white/40 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Trim Start (seconds)</label>
                    <Slider
                      value={[selectedSettings?.trimStart || 0]}
                      onValueChange={([value]) => updateClipSettings(selectedClipId, { trimStart: value })}
                      max={(selectedClip?.video?.duration_seconds || 6) / 2}
                      step={0.1}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {(selectedSettings?.trimStart || 0).toFixed(1)}s
                    </span>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Trim End (seconds)</label>
                    <Slider
                      value={[selectedSettings?.trimEnd || 0]}
                      onValueChange={([value]) => updateClipSettings(selectedClipId, { trimEnd: value })}
                      max={(selectedClip?.video?.duration_seconds || 6) / 2}
                      step={0.1}
                    />
                    <span className="text-xs text-muted-foreground mt-1 block">
                      {(selectedSettings?.trimEnd || 0).toFixed(1)}s
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Speed Panel */}
            {activePanel === 'speed' && (
              <div className="bg-white/5 dark:bg-white/5 bg-white/40 rounded-lg p-4">
                <div className="max-w-md">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Playback Speed: {(selectedSettings?.speed || 1).toFixed(1)}x
                  </label>
                  <Slider
                    value={[(selectedSettings?.speed || 1) * 100]}
                    onValueChange={([value]) => updateClipSettings(selectedClipId, { speed: value / 100 })}
                    min={50}
                    max={200}
                    step={10}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>0.5x</span>
                    <span>1x</span>
                    <span>2x</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <GlassCard className="p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-2">Export Videos</h2>
            <p className="text-muted-foreground mb-6">
              Download all {clips.length} video clips
            </p>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-white/5 bg-white/40">
                <div>
                  <p className="font-medium">All Clips</p>
                  <p className="text-sm text-muted-foreground">{clips.length} videos • {formatTime(totalDuration)}</p>
                </div>
                <GradientButton size="sm" onClick={() => {
                  exportAsZip()
                  setShowExportModal(false)
                }} className="gap-1">
                  <Download className="w-4 h-4" />
                  Download All
                </GradientButton>
              </div>
              
              {clips.map((shot, idx) => (
                <div 
                  key={shot.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-white/5 dark:bg-white/5 bg-white/40"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-6 rounded bg-gradient-to-br flex items-center justify-center text-white text-xs",
                      getGradientFromId(shot.id)
                    )}>
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{shot.title}</p>
                      <p className="text-xs text-muted-foreground">{formatTime(getClipDuration(shot))}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => downloadClip(shot.id)}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
            
            <Button 
              variant="outline" 
              onClick={() => setShowExportModal(false)} 
              className="w-full"
            >
              Close
            </Button>
          </GlassCard>
        </div>
      )}
    </div>
  )
}
