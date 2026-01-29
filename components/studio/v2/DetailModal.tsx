"use client"

import { useStudioStore } from "@/lib/studio/store"
import { X, Info, Download, Calendar, Database, Wand2, Lock, Trash2, ImagePlus, CheckCircle2 } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
// import { MOCK_ASSETS } from "@/lib/studio/mock-data" // Removed mock
import { toggleV2AssetFavorite, deleteV2Asset } from "@/server/actions/studio/v2-assets"

export function DetailModal() {
  const { 
    activeAssetId, 
    setActiveAssetId, 
    assets, 
    addReferenceImage, 
    clearReferenceImages,
    setPrompt,
    updateAsset,
    setError
  } = useStudioStore()
  
  const [mounted, setMounted] = useState(false)
  
  // Find real asset
  const asset = assets.find(a => a.id === activeAssetId)

  useEffect(() => {
    setMounted(true)
    
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setActiveAssetId(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [setActiveAssetId])

  if (!mounted) return null
  if (!activeAssetId || !asset) return null

  const isFinal = asset.is_favorite // Map favorite to Final status
  const metadata = asset.metadata as any || {}

  const handleUseAsRef = () => {
    if (asset.media_url) {
        addReferenceImage(asset.media_url)
        setActiveAssetId(null) // Close modal? Or keep open? Let's close for now or provide feedback
    }
  }

  const handleReusePrompt = () => {
      if (metadata.prompt) {
          setPrompt(metadata.prompt)
      }
      
      // Restore References
      clearReferenceImages()
      if (metadata.reference_urls && Array.isArray(metadata.reference_urls)) {
          metadata.reference_urls.forEach((url: string) => addReferenceImage(url))
      }
      
      setActiveAssetId(null)
  }

  const handleToggleFinal = async () => {
      const { data, error } = await toggleV2AssetFavorite(asset.id)
      if (error) {
          setError(error)
      } else if (data) {
          updateAsset(asset.id, { is_favorite: data.is_favorite } as any)
      }
  }
  
  const handleDownload = async () => {
      if (!asset.media_url) return
      try {
          const response = await fetch(asset.media_url)
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `asset_${asset.id.slice(0, 8)}.${asset.type === 'video' ? 'mp4' : 'png'}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
      } catch {
          setError('Download failed')
      }
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
        
        {/* Backdrop */}
        <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setActiveAssetId(null)}
        />

        {/* Modal Content */}
        <div className="relative w-[95vw] h-[90vh] bg-zinc-950 rounded-2xl shadow-2xl border border-zinc-800 flex overflow-hidden animate-in zoom-in-95 duration-300">
             
             {/* LEFT: ASSET CANVAS */}
             <div className="flex-1 bg-zinc-950/50 relative flex items-center justify-center p-8 group overflow-hidden">
                 
                 {/* Background Blur */}
                 {asset.media_url && (
                     <div 
                        className="absolute inset-0 opacity-20 blur-[100px] saturate-200 pointer-events-none"
                        style={{ backgroundImage: `url(${asset.media_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                     />
                 )}

                 {asset.type === 'image' && asset.media_url && (
                     <img 
                        src={asset.media_url} 
                        alt="detail" 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg z-10"
                     />
                 )}
                 {asset.type === 'video' && asset.media_url && (
                     <video 
                        src={asset.media_url} 
                        controls
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg z-10"
                     />
                 )}
                 {asset.type === 'script' && (
                     <div className="max-w-2xl w-full bg-zinc-900 p-12 shadow-xl border border-zinc-800 min-h-[500px] rounded-xl z-10">
                         <div className="font-mono text-zinc-500 mb-4 text-xs uppercase tracking-widest">Script Content</div>
                         <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap">{asset.content}</pre>
                     </div>
                 )}

                 {/* Top actions */}
                 <div className="absolute top-6 left-6 flex gap-2 z-20">
                     <button 
                        onClick={handleUseAsRef}
                        className="bg-black/50 hover:bg-black/80 backdrop-blur border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                     >
                         <ImagePlus size={14} /> Use as Reference
                     </button>
                     <button 
                        onClick={handleReusePrompt}
                        className="bg-black/50 hover:bg-black/80 backdrop-blur border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                     >
                         <Wand2 size={14} /> Reuse Prompt
                     </button>
                     <button 
                        onClick={handleDownload}
                        className="bg-black/50 hover:bg-black/80 backdrop-blur border border-zinc-700 hover:border-zinc-500 text-zinc-300 hover:text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                     >
                         <Download size={14} /> Download
                     </button>
                 </div>
             </div>

             {/* RIGHT: METADATA SIDEBAR */}
             <div className="w-[350px] bg-zinc-900 border-l border-zinc-800 flex flex-col h-full shrink-0 z-30">
                 
                 {/* Header */}
                 <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800 shrink-0">
                     <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isFinal ? "bg-[#fbbf24]" : "bg-zinc-600"
                        )} />
                        <div className="text-sm font-bold text-zinc-100">Asset Details</div>
                     </div>
                     <button 
                        onClick={() => setActiveAssetId(null)}
                        className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-100 transition-colors"
                     >
                         <X size={18} />
                     </button>
                 </div>

                 {/* Scrollable Body */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin scrollbar-thumb-zinc-700">
                     
                     {/* 1. Full Prompt */}
                     <div className="space-y-3">
                         <Label icon={<Wand2 size={14} />} label="Full Prompt" />
                         <div className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50">
                            <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                                {metadata.prompt || 'No prompt info available'}
                            </p>
                         </div>
                     </div>

                     {/* 2. Params */}
                     <div className="space-y-3">
                         <Label icon={<Info size={14} />} label="Generation Params" />
                         <div className="grid grid-cols-2 gap-3">
                             <MetaItem label="Model" value={metadata.model || 'Unknown'} />
                             <MetaItem label="Seed" value={metadata.seed?.toString() || 'Random'} />
                             {metadata.width && <MetaItem label="Dimensions" value={`${metadata.width}x${metadata.height}`} override />}
                             {metadata.lighting && <MetaItem label="Lighting" value={metadata.lighting} override />}
                             {metadata.camera_settings?.angle && <MetaItem label="Camera" value={metadata.camera_settings.angle} />}
                         </div>
                     </div>

                     {/* 3. Tech Info */}
                     <div className="space-y-3">
                         <Label icon={<Calendar size={14} />} label="File Info" />
                         <div className="space-y-2 text-xs">
                             <MetaRow label="Asset ID" value={asset.id} />
                             <MetaRow label="Type" value={asset.type.toUpperCase()} />
                             <MetaRow label="Created" value={new Date(asset.created_at).toLocaleDateString()} />
                             {asset.parent_id && <MetaRow label="Parent ID" value={asset.parent_id.slice(0, 8) + '...'} />}
                         </div>
                     </div>

                 </div>

                 {/* Footer Actions */}
                 <div className="p-4 border-t border-zinc-800 space-y-2 shrink-0 bg-zinc-900">
                     <button 
                        onClick={handleToggleFinal}
                        className={cn(
                            "w-full py-2.5 font-bold rounded-lg text-xs transition-all flex items-center justify-center gap-2",
                            isFinal 
                                ? "bg-[#fbbf24]/10 text-[#fbbf24] border border-[#fbbf24]/30 hover:bg-[#fbbf24]/20" 
                                : "bg-[#fbbf24] text-black hover:bg-[#fcd34d] shadow-lg shadow-[#fbbf24]/20"
                        )}
                     >
                         <Lock size={14} /> 
                         {isFinal ? 'Marked as Final' : 'Mark as Final'}
                     </button>
                     
                     {/* 
                     <button className="w-full py-2 bg-zinc-800 hover:bg-red-900/20 text-zinc-400 hover:text-red-400 font-medium rounded-lg text-xs transition-all border border-zinc-700 hover:border-red-900/50 flex items-center justify-center gap-2">
                         <Trash2 size={12} /> Delete Asset
                     </button>
                     */}
                 </div>

             </div>

        </div>

    </div>,
    document.body
  )
}

function Label({ icon, label }: any) {
    return (
        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
            {icon}
            {label}
        </div>
    )
}

function MetaItem({ label, value, override }: { label: string; value: string; override?: boolean }) {
    return (
        <div className="bg-zinc-800 border border-zinc-700 p-2 rounded-lg">
             <div className="text-[9px] text-zinc-500 uppercase font-bold mb-1 flex items-center gap-1">
                {label}
                {override && <span className="text-[#a3e635]">*</span>}
             </div>
             <div className={cn(
                 "text-xs font-mono truncate",
                 override ? "text-[#a3e635]" : "text-zinc-300"
             )}>{value}</div>
        </div>
    )
}

function MetaRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-xs py-1 border-b border-zinc-800/50 last:border-0">
             <span className="text-zinc-500 font-medium">{label}</span>
             <span className="text-zinc-400 font-mono select-all">{value}</span>
        </div>
    )
}
