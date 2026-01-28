"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { 
  Heart, 
  Download, 
  Copy, 
  Video, 
  AlertCircle, 
  RefreshCw, 
  Lock,
  ImagePlus,
  Settings2,
  Wand2
} from "lucide-react"
import { useStudioStore } from "@/lib/studio/store"
import { toggleV2AssetFavorite, archiveV2Asset } from "@/server/actions/studio/v2-assets"
import { createV2Variation } from "@/server/actions/studio/v2-generate"

interface AssetCardProps {
  asset: {
    id: string
    type: 'image' | 'video' | 'script'
    prompt?: string
    content?: string
    url?: string
    status: string
    isFavorite: boolean
    parentId?: string
    meta?: { width?: number; height?: number }
  }
}

export function AssetCard({ asset }: AssetCardProps) {
  const { 
    hoveredAssetId, 
    setHoveredAssetId, 
    setActiveAssetId, 
    updateAsset, 
    removeAsset, 
    setError,
    addReferenceImage,
    updateGenerationSettings,
  } = useStudioStore()
  const [showActions, setShowActions] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // STATE LOGIC
  const isGenerating = asset.status === 'processing'
  const isError = asset.status === 'failed'
  const isFinal = asset.isFavorite
  
  // LINEAGE LOGIC
  const isHovered = hoveredAssetId === asset.id
  const isParentHovered = asset.parentId && hoveredAssetId === asset.parentId
  const isLineageActive = isHovered || isParentHovered
  
  // Border class based on state
  const getBorderClass = () => {
    if (isGenerating) return "border-2 border-[#c084fc]"
    if (isError) return "border-2 border-red-500"
    if (isFinal) return "border-2 border-[#fbbf24]"
    return "border border-zinc-800 hover:border-zinc-700"
  }

  // Action handlers
  const handleToggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      const { data, error } = await toggleV2AssetFavorite(asset.id)
      if (error) {
        setError(error)
      } else if (data) {
        updateAsset(asset.id, { is_favorite: data.is_favorite } as any)
      }
    } catch (err) {
      setError('Failed to update')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      const { data, error } = await archiveV2Asset(asset.id)
      if (error) {
        setError(error)
      } else {
        removeAsset(asset.id)
      }
    } catch (err) {
      setError('Failed to archive')
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (asset.prompt) {
      navigator.clipboard.writeText(asset.prompt)
    }
  }

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!asset.url) return
    
    try {
      const response = await fetch(asset.url)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `asset_${asset.id}.${asset.type === 'video' ? 'mp4' : 'png'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError('Download failed')
    }
  }

  const handleUseAsReference = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (asset.url) {
      addReferenceImage(asset.url)
    }
  }

  const handleReuseSettings = (e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Get the full asset from store to access all metadata
    const fullAsset = useStudioStore.getState().assets.find(a => a.id === asset.id)
    if (!fullAsset) return
    
    const metadata = fullAsset.metadata as any
    
    // Copy ALL settings to cockpit
    const settings: any = {}
    
    // Aspect Ratio
    if (asset.meta?.width && asset.meta?.height) {
      const ratio = asset.meta.width / asset.meta.height
      if (ratio > 1.5) settings.aspectRatio = '16:9'
      else if (ratio < 0.7) settings.aspectRatio = '9:16'
      else if (ratio > 1.1) settings.aspectRatio = '4:5'
      else settings.aspectRatio = '1:1'
    }
    
    // Camera settings
    if (metadata?.camera_settings) {
      if (metadata.camera_settings.lens) {
        settings.lens = metadata.camera_settings.lens
      }
      if (metadata.camera_settings.angle) {
        settings.cameraAngle = metadata.camera_settings.angle
      }
    }
    
    // Lighting
    if (metadata?.lighting) {
      settings.lighting = metadata.lighting
    }
    
    // Video duration
    if (metadata?.duration_seconds) {
      settings.duration = metadata.duration_seconds as 4 | 6 | 8
    }
    
    // Seed & Negative Prompt
    if (metadata?.seed) {
      settings.seed = metadata.seed
    }
    if (metadata?.negative_prompt) {
      settings.negativePrompt = metadata.negative_prompt
    }
    
    // Resolution
    if (asset.meta?.width) {
      if (asset.meta.width >= 3840) settings.resolution = '4k'
      else if (asset.meta.width >= 1920) settings.resolution = '1080p'
      else settings.resolution = '720p'
    }
    
    // Update all settings
    updateGenerationSettings(settings)
    
    // Add reference image if exists (RESTORE ORIGINAL CONTEXT)
    // Only use the reference URL stored in metadata (the one used to generate this asset)
    // Do NOT use the asset itself unless it was explicitly used as a ref in a chain (which should be in metadata)
    useStudioStore.getState().clearReferenceImages()
    if (metadata?.reference_url) {
      useStudioStore.getState().addReferenceImage(metadata.reference_url)
    }
    
    // Set generation mode
    if (asset.type === 'video') {
      useStudioStore.getState().setGenerationMode('video')
    } else {
      useStudioStore.getState().setGenerationMode('image')
    }
    
    // Set Prompt
    if (asset.prompt) {
      useStudioStore.getState().setPrompt(asset.prompt)
    }
  }

  const handleCreateVariation = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      const { data, error } = await createV2Variation(asset.id, asset.prompt)
      if (error) {
        setError(error)
      } else if (data) {
        // Asset will be added via generation flow
      }
    } catch (err) {
      setError('Failed to create variation')
    } finally {
      setIsUpdating(false)
    }
  }
  
  return (
    <div 
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData('application/json', JSON.stringify({ assetId: asset.id }))
          e.dataTransfer.effectAllowed = 'move'
        }}
        onClick={() => !isGenerating && !isError && setActiveAssetId(asset.id)}
        onMouseEnter={() => { setHoveredAssetId(asset.id); setShowActions(true) }}
        onMouseLeave={() => { setHoveredAssetId(null); setShowActions(false) }}
        className={cn(
            "group relative break-inside-avoid mb-5 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer",
            "bg-zinc-900/80 backdrop-blur-sm",
            getBorderClass(),
            isLineageActive && !isGenerating && !isError && "ring-2 ring-[#c084fc]/40",
            isParentHovered && "ring-2 ring-[#c084fc] bg-[#c084fc]/5"
        )}
    >
        
        {/* FINAL BADGE */}
        {isFinal && !isGenerating && !isError && (
            <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-[#fbbf24] text-black px-2 py-1 rounded-md shadow-lg shadow-[#fbbf24]/30 text-[9px] font-bold uppercase">
                <Lock size={10} />
                Final
            </div>
        )}

        {/* MEDIA LAYER */}
        <div className="relative aspect-[4/3] bg-zinc-800 overflow-hidden">
             
             {/* Main Image */}
             {asset.type === 'image' && asset.url && !isError && (
                 <img 
                    src={asset.url} 
                    alt="asset" 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" 
                 />
             )}

             {/* Video */}
             {asset.type === 'video' && asset.url && !isError && (
                 <div className="relative w-full h-full bg-black">
                     <video 
                         src={asset.url}
                         className="w-full h-full object-cover"
                         controls
                         loop
                         muted
                         playsInline
                         preload="metadata"
                     />
                     <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-[#c084fc] uppercase tracking-wider flex items-center gap-1.5 border border-[#c084fc]/30">
                         <Video size={10} />
                         Video
                     </div>
                 </div>
             )}
             
             {/* Video Loading State */}
             {asset.type === 'video' && !asset.url && !isError && (
                 <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900 relative">
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#c084fc]/5 to-[#a3e635]/5" />
                      <Video className="text-zinc-600" size={32} />
                 </div>
             )}

             {/* Script Card */}
             {asset.type === 'script' && (
                 <div className="w-full h-full p-5 bg-zinc-900 flex flex-col border-l-2 border-[#a3e635]">
                     <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-2">SCENE</div>
                     <div className="font-mono text-zinc-300 text-xs leading-relaxed line-clamp-3 flex-1">
                         {asset.content}
                     </div>
                 </div>
             )}
             
             {/* GENERATING STATE OVERLAY */}
             {isGenerating && (
                 <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900/80 backdrop-blur-sm">
                      <div className="w-10 h-10 rounded-full border-2 border-[#c084fc] border-t-transparent animate-spin mb-3" />
                      <span className="text-[10px] font-bold text-[#c084fc] uppercase tracking-widest">Generating</span>
                 </div>
             )}
             
             {/* ERROR STATE OVERLAY */}
             {isError && (
                 <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-900/90">
                      <AlertCircle className="text-red-500 mb-2" size={24} />
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest mb-3">Failed</span>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors text-[10px] font-bold uppercase">
                          <RefreshCw size={10} /> Retry
                      </button>
                 </div>
             )}

             {/* HOVER ACTIONS OVERLAY */}
             {!isGenerating && !isError && showActions && (
                 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-3 z-10 pointer-events-none">
                     
                     <div className="flex items-center justify-between pointer-events-auto">
                          <div className="flex gap-1.5">
                               <ActionBtn 
                                   icon={<Heart size={14} fill={isFinal ? "currentColor" : "none"} />} 
                                   tooltip="Save" 
                                   active={isFinal}
                                   onClick={handleToggleFavorite}
                                   disabled={isUpdating}
                               />
                               <ActionBtn 
                                   icon={<Download size={14} />} 
                                   tooltip="Download"
                                   onClick={handleDownload}
                               />
                               <ActionBtn 
                                   icon={<Copy size={14} />} 
                                   tooltip="Copy Prompt"
                                   onClick={handleCopyPrompt}
                               />
                          </div>
                          
                          <div className="flex gap-1.5">
                               <ActionBtn 
                                   icon={<ImagePlus size={14} />} 
                                   tooltip="Use as Reference"
                                   onClick={handleUseAsReference}
                               />
                               <ActionBtn 
                                   icon={<Settings2 size={14} />} 
                                   tooltip="Reuse Prompt"
                                   onClick={handleReuseSettings}
                               />
                               <ActionBtn 
                                   icon={<Wand2 size={14} />} 
                                   tooltip="Create Variation"
                                   onClick={handleCreateVariation}
                                   disabled={isUpdating}
                               />
                          </div>
                     </div>
                 </div>
             )}

        </div>

        {/* METADATA FOOTER */}
        <div className="p-3.5 bg-zinc-900/90">
             <p className={cn(
                 "text-[13px] font-medium leading-snug line-clamp-2 mb-2",
                 isError ? "text-zinc-500" : "text-zinc-200"
             )}>
                 {asset.prompt || "Untitled Asset"}
             </p>
             
             {!isError && (
                <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-2 text-zinc-500 font-mono">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-br from-[#c084fc]/30 to-[#a3e635]/30 border border-[#c084fc]/20 flex items-center justify-center">
                              <Wand2 size={8} className="text-[#c084fc]" />
                          </div>
                          <span>v4.2</span>
                          <span className="text-zinc-700">•</span>
                          <span>2m ago</span>
                      </div>
                      
                      {asset.meta?.width && (
                          <span className="font-mono text-zinc-600 bg-zinc-800/50 px-1.5 py-0.5 rounded border border-zinc-700/50">
                              {asset.meta.width}×{asset.meta.height}
                          </span>
                      )}
                </div>
             )}
        </div>

    </div>
  )
}

// Action Button Component
function ActionBtn({ 
  icon, 
  tooltip, 
  active, 
  className,
  onClick,
  disabled 
}: { 
  icon: React.ReactNode
  tooltip?: string
  active?: boolean
  className?: string
  onClick?: (e: React.MouseEvent) => void
  disabled?: boolean
}) {
    return (
        <button 
            onClick={onClick}
            disabled={disabled}
            title={tooltip}
            className={cn(
                "w-8 h-8 flex items-center justify-center rounded-lg border backdrop-blur-md transition-all",
                active 
                    ? "bg-[#a3e635] border-[#a3e635] text-black" 
                    : "bg-black/50 border-zinc-600/50 text-zinc-300 hover:bg-black/70 hover:border-zinc-500 hover:text-white",
                disabled && "opacity-50 cursor-not-allowed",
                className
            )}
        >
            {icon}
        </button>
    )
}
