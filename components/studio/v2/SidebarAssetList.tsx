"use client"

import { useStudioStore } from "@/lib/studio/store"

import { Image as ImageIcon, Video } from "lucide-react"

export function SidebarAssetList() {
    const { assets } = useStudioStore()

    // Filter for visual assets only
    const visualAssets = assets.filter(a => a.type === 'image' || a.type === 'video')

    const onDragStart = (e: React.DragEvent, asset: any) => {
        const payload = {
            type: 'asset',
            id: asset.id,
            assetId: asset.id, // Compatibility with AssetBin
            url: asset.media_url,
            prompt: asset.metadata?.prompt || '',
            mediaType: asset.type
        }
        e.dataTransfer.setData('application/json', JSON.stringify(payload))
        e.dataTransfer.effectAllowed = 'copy'
        
        // Visual drag feedback
        // const img = new Image()
        // img.src = asset.media_url
        // e.dataTransfer.setDragImage(img, 20, 20)
    }

    if (visualAssets.length === 0) return null

    return (
        <div className="grid grid-cols-2 gap-2">
            {visualAssets.map((asset) => (
                <div 
                    key={asset.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, asset)}
                    className="relative group aspect-square rounded-md overflow-hidden bg-zinc-800 border border-zinc-700/50 hover:border-zinc-600 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] shadow-sm"
                >
                    {asset.type === 'image' ? (
                        <img src={asset.media_url || ''} alt="asset" className="w-full h-full object-cover" />
                    ) : (
                        <video src={asset.media_url || ''} className="w-full h-full object-cover" />
                    )}

                    {/* Type Badge */}
                    <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm p-1 rounded text-white/80">
                         {asset.type === 'image' ? <ImageIcon size={10} /> : <Video size={10} />}
                    </div>

                    {/* Hover Info */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <p className="text-[10px] text-white line-clamp-2 leading-tight">
                            {asset.metadata?.prompt || 'No prompt'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    )
}
