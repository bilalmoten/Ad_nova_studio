"use client"

import { useStudioStore } from "@/lib/studio/store"
import { MOCK_ASSETS } from "@/lib/studio/mock-data"
import { X, Info, Download, Share2, Calendar, Database, Wand2, Lock, Trash2 } from "lucide-react"
import { createPortal } from "react-dom"
import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"

export function DetailModal() {
  const { activeAssetId, setActiveAssetId } = useStudioStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const handleEsc = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setActiveAssetId(null)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [setActiveAssetId])

  if (!mounted) return null
  
  const asset = MOCK_ASSETS.find(a => a.id === activeAssetId)
  if (!activeAssetId || !asset) return null

  const isFinal = asset.isFavorite

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
        
        {/* Backdrop (80% dim per brief) */}
        <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setActiveAssetId(null)}
        />

        {/* Modal Content */}
        <div className="relative w-[90vw] h-[85vh] bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-700 flex overflow-hidden animate-in zoom-in-95 duration-300">
             
             {/* LEFT: ASSET CANVAS */}
             <div className="flex-1 bg-zinc-950 relative flex items-center justify-center p-8 group">
                 {asset.type === 'image' && asset.url && (
                     <img 
                        src={asset.url} 
                        alt="detail" 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
                     />
                 )}
                 {asset.type === 'video' && (
                     <div className="text-zinc-500 font-mono">Video Preview Placeholder</div>
                 )}
                 {asset.type === 'script' && (
                     <div className="max-w-2xl w-full bg-zinc-900 p-12 shadow-xl border border-zinc-800 min-h-[500px] rounded-xl">
                         <pre className="font-mono text-sm text-zinc-300 whitespace-pre-wrap">{asset.content}</pre>
                     </div>
                 )}

                 {/* Absolute Actions */}
                 <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button className="bg-zinc-800/90 backdrop-blur border border-zinc-700 p-2 rounded-lg text-zinc-400 hover:text-[#a3e635] hover:border-[#a3e635]/50 shadow-lg transition-all">
                         <Share2 size={16} />
                     </button>
                     <button className="bg-zinc-800/90 backdrop-blur border border-zinc-700 p-2 rounded-lg text-zinc-400 hover:text-[#a3e635] hover:border-[#a3e635]/50 shadow-lg transition-all">
                         <Download size={16} />
                     </button>
                 </div>
             </div>

             {/* RIGHT: METADATA SIDEBAR */}
             <div className="w-[320px] bg-zinc-900 border-l border-zinc-800 flex flex-col h-full">
                 
                 {/* Header */}
                 <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
                     <div className="text-sm font-bold text-zinc-100">Asset Details</div>
                     <button 
                        onClick={() => setActiveAssetId(null)}
                        className="p-1.5 hover:bg-zinc-800 rounded-full text-zinc-500 hover:text-zinc-100 transition-colors"
                     >
                         <X size={18} />
                     </button>
                 </div>

                 {/* Scrollable Body */}
                 <div className="flex-1 overflow-y-auto p-6 space-y-8">
                     
                     {/* 1. Full Prompt */}
                     <div className="space-y-3">
                         <Label icon={<Wand2 size={14} />} label="Full Prompt" />
                         <p className="text-sm text-zinc-300 leading-relaxed font-medium">
                             {asset.prompt}
                         </p>
                     </div>

                     {/* 2. All Anchors */}
                     <div className="space-y-3">
                         <Label icon={<Database size={14} />} label="Applied Anchors" />
                         <div className="flex flex-wrap gap-2">
                             <AnchorChip label="Char: Neo" type="character" />
                             <AnchorChip label="Style: Cyberpunk" type="style" />
                         </div>
                     </div>

                     {/* 3. Resolved Parameters */}
                     <div className="space-y-3">
                         <Label icon={<Info size={14} />} label="Final Parameters" />
                         <div className="grid grid-cols-2 gap-3">
                             <MetaItem label="Model" value="Midjourney v6" />
                             <MetaItem label="Steps" value="50" />
                             <MetaItem label="Seed" value="29384710" />
                             <MetaItem label="Guidance" value="7.5" />
                             <MetaItem label="Lighting" value="Neon" override />
                             <MetaItem label="Camera" value="Wide 16mm" />
                         </div>
                     </div>

                     {/* 4. File Info */}
                     <div className="space-y-3">
                         <Label icon={<Calendar size={14} />} label="File Info" />
                         <div className="space-y-2">
                             <MetaRow label="Created" value="2 mins ago" />
                             <MetaRow label="Dimensions" value={`${asset.meta?.width || 1920} x ${asset.meta?.height || 1080}`} />
                             <MetaRow label="Size" value="4.2 MB" />
                         </div>
                     </div>

                 </div>

                 {/* Footer Actions */}
                 <div className="p-4 border-t border-zinc-800 space-y-2">
                     {!isFinal ? (
                         <button className="w-full py-2.5 bg-[#fbbf24] hover:bg-[#fcd34d] text-black font-bold rounded-lg text-xs transition-all shadow-lg shadow-[#fbbf24]/20 flex items-center justify-center gap-2">
                             <Lock size={14} /> Mark as Final
                         </button>
                     ) : (
                         <div className="w-full py-2.5 bg-[#fbbf24]/20 text-[#fbbf24] font-bold rounded-lg text-xs text-center border border-[#fbbf24]/30 flex items-center justify-center gap-2">
                             <Lock size={14} /> Final Asset
                         </div>
                     )}
                     <button className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 font-medium rounded-lg text-xs transition-all border border-zinc-700 flex items-center justify-center gap-2">
                         <Trash2 size={12} /> Archive
                     </button>
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

function AnchorChip({ label, type }: { label: string; type: string }) {
    return (
        <span className={cn(
            "px-2 py-1 rounded text-[10px] font-semibold border",
            type === 'character' ? "bg-[#c084fc]/10 border-[#c084fc]/30 text-[#c084fc]" :
            type === 'style' ? "bg-[#c084fc]/10 border-[#c084fc]/30 text-[#c084fc]" :
            "bg-zinc-800 border-zinc-700 text-zinc-400"
        )}>
            {label}
        </span>
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
        <div className="flex justify-between text-xs">
             <span className="text-zinc-500">{label}</span>
             <span className="text-zinc-300 font-medium">{value}</span>
        </div>
    )
}
