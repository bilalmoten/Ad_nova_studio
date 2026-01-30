import { useState, useRef } from "react"
import { cn } from "@/lib/utils"
import { useStudioStore } from "@/lib/studio/store"
import { Image as ImageIcon, Video, Upload, Loader2 } from "lucide-react"
import { uploadTempImage } from "@/server/actions/studio/v2-upload"
import { createV2Asset } from "@/server/actions/studio/v2-assets"

export function SidebarAssetList() {
    const { assets, projectId, addAsset, setError } = useStudioStore()
    const [filter, setFilter] = useState<'all' | 'uploads' | 'generated'>('all')
    const [isUploading, setIsUploading] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Filter assets - Sidebar only shows UPLOADS and FAVORITES
    const visualAssets = assets.filter(a => {
        // Base type check
        if (a.type !== 'image' && a.type !== 'video') return false
        
        const isUpload = !!(a.metadata as any)?.is_upload
        const isFavorite = a.is_favorite
        
        // Tab filter
        if (filter === 'uploads') {
            return isUpload
        }
        if (filter === 'generated') {
            // "Generated" tab shows favorites/finalized generated assets
            return isFavorite && !isUpload
        }
        
        // "All" shows both uploads and favorites
        return isUpload || isFavorite
    })

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !projectId) return

        setIsUploading(true)
        try {
            // 1. Upload file
            const formData = new FormData()
            formData.append('file', file)
            const { url, error: uploadError } = await uploadTempImage(formData)

            if (uploadError || !url) throw new Error(uploadError || 'Upload failed')

            // 2. Create Asset Record
            const { data: newAsset, error: dbError } = await createV2Asset({
                project_id: projectId,
                type: 'image', // Assuming image uploads for now
                media_url: url,
                metadata: {
                    prompt: file.name, // Use filename as initial prompt/title
                    is_upload: true,
                    width: 0, // We assume unknown dimensions for now or could extract
                    height: 0 
                },
                is_temporary: false // Persist immediately
            })

            if (dbError || !newAsset) throw new Error(dbError || 'Failed to save asset')

            // 3. Add to store
            addAsset(newAsset)

        } catch (err: any) {
            console.error('Upload Error:', err)
            setError(err.message || 'Failed to upload asset')
        } finally {
            setIsUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const onDragStart = (e: React.DragEvent, asset: any) => {
        const payload = {
            type: 'asset',
            id: asset.id,
            assetId: asset.id, 
            url: asset.media_url,
            prompt: asset.metadata?.prompt || '',
            mediaType: asset.type
        }
        e.dataTransfer.setData('application/json', JSON.stringify(payload))
        e.dataTransfer.effectAllowed = 'copy'
    }

    return (
        <div className="flex flex-col h-full">
            
            {/* Header / Controls */}
            <div className="flex items-center justify-between mb-4 shrink-0">
                <div className="flex bg-zinc-900 rounded-lg p-0.5 border border-zinc-800">
                     <button 
                        onClick={() => setFilter('all')}
                        className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all", filter === 'all' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
                     >
                        ALL
                     </button>
                     <button 
                        onClick={() => setFilter('uploads')}
                        className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all", filter === 'uploads' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
                     >
                        UPLOADS
                     </button>
                     <button 
                        onClick={() => setFilter('generated')}
                        className={cn("px-2.5 py-1 text-[10px] font-bold rounded-md transition-all", filter === 'generated' ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300")}
                     >
                        FINAL
                     </button>
                </div>

                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#a3e635]/10 text-[#a3e635] text-[10px] font-bold border border-[#a3e635]/20 hover:bg-[#a3e635]/20 transition-all"
                >
                    {isUploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
                    <span>UPLOAD</span>
                </button>
                <input 
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleUpload}
                />
            </div>

            {/* List */}
            {visualAssets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                    <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mb-3">
                        <ImageIcon size={20} className="opacity-50" />
                    </div>
                    <p className="text-xs font-medium">No assets found</p>
                    <p className="text-[10px] opacity-70 mt-1">
                        {filter === 'uploads' ? 'Upload an image to start' : 'Generate or upload assets'}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-2 pb-4">
                    {visualAssets.map((asset) => (
                        <div 
                            key={asset.id}
                            draggable
                            onDragStart={(e) => onDragStart(e, asset)}
                            className="relative group aspect-square rounded-md overflow-hidden bg-zinc-800 border border-zinc-700/50 hover:border-zinc-500 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] shadow-sm"
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

                            {/* Source Bage (Upload vs Gen) */}
                            {((asset.metadata as any)?.is_upload) && (
                                <div className="absolute top-1 right-1 bg-[#a3e635]/80 text-black p-0.5 px-1.5 rounded-[3px] text-[8px] font-bold backdrop-blur-sm">
                                    UP
                                </div>
                            )}

                            {/* Hover Info */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <p className="text-[10px] text-white line-clamp-2 leading-tight">
                                    {asset.metadata?.prompt || 'No prompt'}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
