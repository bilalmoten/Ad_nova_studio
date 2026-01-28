"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { ChevronRight, ChevronDown, FileText, Layers, Plus, X, Archive, Sparkles } from "lucide-react"
import { useStudioStore } from "@/lib/studio/store"

interface AssetBinProps {
    onParse?: () => void
}

export function AssetBin({ onParse }: AssetBinProps) {
    return (
        <div className="h-full flex flex-col">
            <ShotList onEditScript={onParse || (() => {})} />
        </div>
    )
}

function ShotList({ onEditScript }: { onEditScript: () => void }) {
    const { 
        shots, 
        activeShotId, 
        setActiveShotId, 
        assets,
        addShot,
        bindAssetToShot,
    } = useStudioStore()
    
    // Drag state
    const [dragOverShotId, setDragOverShotId] = useState<string | null>(null)
    
    const [expandedShots, setExpandedShots] = useState<Set<string>>(new Set())
    
    // Get unbound assets (not assigned to any shot)
    const unboundAssets = assets.filter(a => !(a.metadata as any)?.shot_id)
    
    // Get assets per shot
    const getAssetsForShot = (shotId: string) => {
        return assets.filter(a => (a.metadata as any)?.shot_id === shotId)
    }
    
    const toggleExpand = (shotId: string) => {
        setExpandedShots(prev => {
            const next = new Set(prev)
            if (next.has(shotId)) {
                next.delete(shotId)
            } else {
                next.add(shotId)
            }
            return next
        })
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <Layers size={14} className="text-[#a3e635]" />
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Shot Organizer</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#a3e635]/10 border border-[#a3e635]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#a3e635] animate-pulse"/>
                    <span className="text-[9px] text-[#a3e635] font-bold uppercase tracking-wider">Live</span>
                </div>
            </div>
            
            {/* Shots & Assets List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                
                {/* All Assets Button */}
                <div className="mb-3">
                    <div 
                        className={cn(
                            "flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all border group",
                            activeShotId === 'ALL'
                                ? "bg-gradient-to-br from-[#a3e635]/15 to-[#a3e635]/5 border-[#a3e635]/30 ring-1 ring-[#a3e635]/20"
                                : "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700"
                        )}
                        onClick={() => setActiveShotId('ALL')}
                    >
                        <div className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                            activeShotId === 'ALL'
                                ? "bg-[#a3e635]/20 text-[#a3e635]" 
                                : "bg-zinc-800/50 text-zinc-600 group-hover:bg-zinc-700 group-hover:text-zinc-400"
                        )}>
                            <Layers size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className={cn(
                                "text-xs font-bold mb-0.5",
                                activeShotId === 'ALL' ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"
                            )}>
                                All Assets
                            </div>
                            <div className="text-[10px] text-zinc-600 font-mono">
                                {assets.length} total
                            </div>
                        </div>
                    </div>
                </div>

                {/* Unbound Assets Section */}
                {unboundAssets.length > 0 && (
                    <div className="mb-3">
                        <div 
                            className={cn(
                                "flex items-center gap-2.5 p-3 rounded-xl cursor-pointer transition-all border group",
                                activeShotId === null
                                    ? "bg-gradient-to-br from-[#c084fc]/15 to-[#c084fc]/5 border-[#c084fc]/30 ring-1 ring-[#c084fc]/20"
                                    : dragOverShotId === 'unbound'
                                    ? "bg-[#c084fc]/10 border-[#c084fc]/30 ring-1 ring-[#c084fc]/20"
                                    : "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700"
                            )}
                            onClick={() => setActiveShotId(null)}
                            onDragOver={(e) => {
                                e.preventDefault()
                                setDragOverShotId('unbound')
                            }}
                            onDragLeave={() => setDragOverShotId(null)}
                            onDrop={(e) => {
                                e.preventDefault()
                                setDragOverShotId(null)
                                try {
                                    const data = JSON.parse(e.dataTransfer.getData('application/json'))
                                    if (data.assetId) {
                                        bindAssetToShot(data.assetId, null) // Unbind
                                    }
                                } catch (err) {
                                    console.error('Drop error:', err)
                                }
                            }}
                        >
                            <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center transition-all",
                                activeShotId === null 
                                    ? "bg-[#c084fc]/20 text-[#c084fc]" 
                                    : "bg-zinc-800/50 text-zinc-600 group-hover:bg-zinc-700 group-hover:text-zinc-400"
                            )}>
                                <Archive size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className={cn(
                                    "text-xs font-bold mb-0.5",
                                    activeShotId === null ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"
                                )}>
                                    Unbound Assets
                                </div>
                                <div className="text-[10px] text-zinc-600 font-mono">
                                    {unboundAssets.length} asset{unboundAssets.length !== 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {shots.length === 0 && unboundAssets.length === 0 && (
                    <div className="text-center py-12 px-4">
                        <div className="w-16 h-16 mx-auto mb-3 rounded-xl bg-zinc-800/50 flex items-center justify-center">
                            <FileText size={28} className="text-zinc-700" />
                        </div>
                        <div className="text-xs font-medium text-zinc-500 mb-1">No shots yet</div>
                        <div className="text-[10px] text-zinc-600">Parse a script to begin</div>
                    </div>
                )}

                {/* Shots */}
                {shots.map((shot) => {
                    const isActive = shot.id === activeShotId
                    const isExpanded = expandedShots.has(shot.id)
                    const shotAssets = getAssetsForShot(shot.id)
                    
                    return (
                        <div key={shot.id} className="space-y-1.5">
                            {/* Shot Header */}
                            <div 
                                className={cn(
                                    "group flex items-start gap-2.5 p-3 rounded-xl cursor-pointer transition-all border select-none",
                                    isActive 
                                        ? "bg-gradient-to-br from-[#a3e635]/15 to-[#a3e635]/5 border-[#a3e635]/30 ring-1 ring-[#a3e635]/20" 
                                        : dragOverShotId === shot.id
                                        ? "bg-[#a3e635]/10 border-[#a3e635]/30 ring-1 ring-[#a3e635]/20"
                                        : "bg-zinc-900/30 border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-700"
                                )}
                                onDragOver={(e) => {
                                    e.preventDefault()
                                    setDragOverShotId(shot.id)
                                }}
                                onDragLeave={() => setDragOverShotId(null)}
                                onDrop={(e) => {
                                    e.preventDefault()
                                    setDragOverShotId(null)
                                    try {
                                        const data = JSON.parse(e.dataTransfer.getData('application/json'))
                                        if (data.assetId) {
                                            bindAssetToShot(data.assetId, shot.id)
                                        }
                                    } catch (err) {
                                        console.error('Drop error:', err)
                                    }
                                }}
                            >
                                {/* Expand/Collapse */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        toggleExpand(shot.id)
                                    }}
                                    className={cn(
                                        "mt-1 transition-all",
                                        isActive ? "text-[#a3e635]" : "text-zinc-600 group-hover:text-zinc-400"
                                    )}
                                >
                                    {isExpanded ? (
                                        <ChevronDown size={14} />
                                    ) : (
                                        <ChevronRight size={14} />
                                    )}
                                </button>
                                
                                {/* Shot Content */}
                                <div 
                                    className="flex-1 min-w-0"
                                    onClick={() => setActiveShotId(shot.id)}
                                >
                                    {/* Shot ID & Title */}
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className={cn(
                                            "px-2 py-0.5 rounded-md text-[10px] font-bold font-mono transition-all",
                                            isActive 
                                                ? "bg-[#a3e635] text-black shadow-sm" 
                                                : "bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700 group-hover:text-zinc-300"
                                        )}>
                                            {shot.id}
                                        </div>
                                        <div className={cn(
                                            "text-xs font-semibold truncate flex-1",
                                            isActive ? "text-zinc-100" : "text-zinc-400 group-hover:text-zinc-200"
                                        )}>
                                            {shot.title}
                                        </div>
                                    </div>
                                    
                                    {/* Description */}
                                    {shot.description && (
                                        <p className={cn(
                                            "text-[11px] leading-snug line-clamp-2 mb-2 transition-colors",
                                            isActive ? "text-zinc-400" : "text-zinc-600 group-hover:text-zinc-500"
                                        )}>
                                            {shot.description}
                                        </p>
                                    )}
                                    
                                    {/* Asset Count */}
                                    <div className="flex items-center gap-1.5">
                                        <Layers size={9} className={isActive ? "text-zinc-500" : "text-zinc-600"} />
                                        <span className={cn(
                                            "text-[9px] font-medium font-mono",
                                            isActive ? "text-zinc-500" : "text-zinc-600 group-hover:text-zinc-500"
                                        )}>
                                            {shotAssets.length} asset{shotAssets.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Expanded: Show assets */}
                            {isExpanded && shotAssets.length > 0 && (
                                <div className="ml-6 pl-4 border-l-2 border-zinc-800/50 space-y-1.5 py-1">
                                    {shotAssets.map((asset) => (
                                        <div 
                                            key={asset.id}
                                            draggable
                                            onDragStart={(e) => {
                                                const payload = {
                                                    type: 'asset',
                                                    assetId: asset.id, // For ShotBin
                                                    id: asset.id, // For others
                                                    url: asset.media_url,
                                                    prompt: (asset.metadata as any)?.prompt,
                                                    mediaType: asset.type
                                                }
                                                e.dataTransfer.setData('application/json', JSON.stringify(payload))
                                                e.dataTransfer.effectAllowed = 'copy'
                                            }}
                                            className="flex items-center gap-2 p-2 rounded-lg bg-zinc-900/50 hover:bg-zinc-800/70 transition-all group/asset border border-transparent hover:border-zinc-700 cursor-grab active:cursor-grabbing"
                                        >
                                            {/* Asset Thumbnail */}
                                            {asset.media_url && (
                                                <div className="w-10 h-10 rounded-lg bg-zinc-800 overflow-hidden flex-shrink-0 ring-1 ring-black/20">
                                                    <img 
                                                        src={asset.media_url} 
                                                        alt="" 
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                            )}
                                            
                                            {/* Asset Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[10px] text-zinc-400 truncate font-medium">
                                                    {(asset.metadata as any)?.prompt || 'Untitled'}
                                                </div>
                                                <div className="text-[9px] text-zinc-600 font-mono uppercase tracking-wide">
                                                    {asset.type}
                                                </div>
                                            </div>
                                            
                                            {/* Unbind button */}
                                            <button
                                                onClick={() => {
                                                    useStudioStore.getState().bindAssetToShot(asset.id, null)
                                                }}
                                                className="opacity-0 group-hover/asset:opacity-100 transition-opacity w-6 h-6 rounded-md bg-zinc-800 hover:bg-red-900/50 flex items-center justify-center"
                                                title="Unbind from shot"
                                            >
                                                <X size={12} className="text-zinc-500 hover:text-red-400" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>

            {/* Footer Buttons */}
            <div className="shrink-0 pt-4 border-t border-zinc-800 space-y-2">
                <button 
                    onClick={onEditScript}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-bold text-zinc-400 hover:text-[#a3e635] bg-zinc-900/50 hover:bg-zinc-800/70 rounded-xl transition-all border border-zinc-800 hover:border-[#a3e635]/30 group"
                >
                    <Sparkles size={13} className="group-hover:scale-110 transition-transform" />
                    <span>Parse Script with AI</span>
                </button>
                
                <button 
                    onClick={() => {
                        // Manual shot creation
                        const newShot = {
                            id: `${shots.length + 1}A`,
                            title: `Shot ${shots.length + 1}A`,
                            description: 'New shot',
                            assetIds: [],
                        }
                        addShot(newShot)
                    }}
                    className="w-full py-2.5 flex items-center justify-center gap-2 text-[11px] font-bold text-zinc-500 hover:text-[#c084fc] bg-zinc-900/50 hover:bg-zinc-800/70 rounded-xl transition-all border border-zinc-800 hover:border-[#c084fc]/30 group"
                >
                    <Plus size={13} className="group-hover:scale-110 transition-transform" />
                    <span>Add Shot Manually</span>
                </button>
            </div>
        </div>
    )
}
