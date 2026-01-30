"use client"

import { useEffect, useState, use } from "react"
import { StudioLayout } from "@/components/studio/v2/StudioLayout"
import { AssetBin } from "@/components/studio/v2/AssetBin"
import { CockpitPromptBar } from "@/components/studio/v2/CockpitPromptBar"
import { AssetCard } from "@/components/studio/v2/AssetCard"
import { ScriptParseModal } from "@/components/studio/v2/ScriptParseModal"
import { ContextPanel } from "@/components/studio/v2/ContextPanel"
import { useStudioStore } from "@/lib/studio/store"
import { getV2Assets } from "@/server/actions/studio/v2-assets"
import { getV2Projects } from "@/server/actions/studio/v2-projects"
// import type { V2Asset } from "@/lib/studio/v2-types"
import { FileText } from "lucide-react"
import { SidebarAssetList } from "@/components/studio/v2/SidebarAssetList"
// We'll import these dynamically or at top lvl
import { VideoGenerationView } from "@/components/studio/v2/VideoGenerationView"
import { VideoEditorView } from "@/components/studio/v2/VideoEditorView"

export default function StudioPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params)
  const { 
    assets, 
    setAssets, 
    isGenerating, 
    isLoadingAssets,
    setIsLoadingAssets,
    setProject,
    error,
    setError,
    setShots
  } = useStudioStore()
  
  const [initialized, setInitialized] = useState(false)
  const [showScriptModal, setShowScriptModal] = useState(false)

  // Initialize: Load project by ID
  useEffect(() => {
    async function initProject() {
      if (initialized) return
      setInitialized(true)
      
      try {
        setIsLoadingAssets(true)
        
        // 1. Get specific project
        const { data: projects, error: projectsError } = await getV2Projects()
        
        if (projectsError) {
          setError(projectsError)
          return
        }

        const currentProject = projects.find(p => p.id === projectId)
        
        if (!currentProject) {
          setError('Project not found')
          return
        }
        
        setProject(currentProject)
        
        // 2. Load assets for this project
        const { data: loadedAssets, error: assetsError } = await getV2Assets(currentProject.id)
        
        if (assetsError) {
          setError(assetsError)
          return
        }
        
        setAssets(loadedAssets)

        // 3. Hydrate shots from latest script
        const latestScript = loadedAssets
            .filter(a => a.type === 'script')
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]

        if (latestScript && (latestScript.metadata as any)?.parsed_shots) {
             const hydratedShots = (latestScript.metadata as any).parsed_shots.map((s: any) => {
                 // Find assets linked to this shot
                 const relatedAssetIds = loadedAssets
                    .filter(a => (a.metadata as any)?.shot_id === s.id && a.status === 'ready')
                    .map(a => a.id)

                 return {
                     id: s.id,
                     title: s.title || 'Untitled',
                     description: s.description,
                     assetIds: relatedAssetIds,
                  }
             })
             
             setShots(hydratedShots)
        }
        
      } catch {
        setError('Failed to initialize studio')
      } finally {
        setIsLoadingAssets(false)
      }
    }
    
    if (projectId) {
        initProject()
    }
  }, [initialized, projectId, setAssets, setProject, setIsLoadingAssets, setError, setShots])

  // Convert V2Asset to display format
  const displayAssets = assets.map(asset => ({
    id: asset.id,
    projectId: asset.project_id,
    type: asset.type as 'image' | 'video' | 'script',
    prompt: (asset.metadata as any)?.prompt || '',
    content: asset.content || undefined,
    url: asset.media_url || undefined,
    status: asset.status,
    isFavorite: asset.is_favorite,
    parentId: asset.parent_id || undefined,
    meta: {
      width: (asset.metadata as any)?.width,
      height: (asset.metadata as any)?.height,
    },
    createdAt: asset.created_at,
  }))

  // Filter assets based on sidebar selection
  const { activeShotId } = useStudioStore()
  const filteredAssets = (activeShotId === 'ALL'
    ? displayAssets
    : activeShotId 
    ? displayAssets.filter(a => {
        const assetShotId = assets.find(asset => asset.id === a.id)?.metadata?.shot_id
        return assetShotId === activeShotId
      })
    : displayAssets.filter(a => {
        // When "Unbound" is selected (null), show only unbound assets
        const assetShotId = assets.find(asset => asset.id === a.id)?.metadata?.shot_id
        return !assetShotId
      })
  ).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())

  // View Switching
  const [viewMode, setViewMode] = useState<'assets' | 'generate' | 'edit'>('assets')
  
  // Grid Columns
  const [gridCols, setGridCols] = useState(4)

  return (
    <>
    <StudioLayout
       vaultContent={<AssetBin onParse={() => setShowScriptModal(true)} />}
       assetsContent={<SidebarAssetList />}
       cockpitContent={viewMode === 'assets' ? <CockpitPromptBar /> : null}
       contextContent={<ContextPanel />}
       viewMode={viewMode}
       onViewModeChange={setViewMode}
       gridCols={gridCols}
       onGridColsChange={setGridCols}
    >
        
        {viewMode === 'generate' && (
             <VideoGenerationView />
        )}

        {viewMode === 'edit' && (
             <VideoEditorView />
        )}

        {viewMode === 'assets' && (
        <div className="py-6 px-5 pb-36">
            
            {/* Shot Filter Info */}
            {activeShotId && (
                <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 text-xs">
                    <span className="font-medium text-zinc-400">Viewing:</span>
                    <span className="font-bold text-[#a3e635]">
                        {activeShotId === 'ALL' ? 'All Assets' : `Shot ${useStudioStore.getState().shots.find(s => s.id === activeShotId)?.id || activeShotId}`}
                    </span>
                    <button 
                        onClick={() => useStudioStore.getState().setActiveShotId(null)}
                        className="ml-auto text-zinc-500 hover:text-zinc-300"
                    >
                        Show All
                    </button>
                </div>
            )}
            
            {/* Error Banner */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                    {error}
                    <button 
                        onClick={() => setError(null)}
                        className="ml-2 underline hover:no-underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Date Separator */}
            <div className="flex items-center gap-4 mb-6">
                 <div className="h-px bg-zinc-800 flex-1" />
                 <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">Today</span>
                 <div className="h-px bg-zinc-800 flex-1" />
            </div>

            {/* Loading State */}
            {isLoadingAssets && (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 rounded-full border-2 border-[#a3e635] border-t-transparent animate-spin" />
                </div>
            )}

            {/* Empty State */}
            {!isLoadingAssets && assets.length === 0 && !isGenerating && (
                <div className="text-center py-20">
                    <div className="text-zinc-500 mb-2">No assets yet</div>
                    <div className="text-zinc-600 text-sm">Use the prompt bar below to generate your first asset</div>
                </div>
            )}

            {/* Masonry Grid */}
            {!isLoadingAssets && (
                <div className="flex gap-4 items-start">
                    {(() => {
                        // Prepare Items
                        const queueItems = useStudioStore.getState().generationQueue.map(q => ({ ...q, _type: 'queue' as const }))
                        const assetItems = filteredAssets.map(a => ({ ...a, _type: 'asset' as const }))
                        const allItems = [...queueItems, ...assetItems]
                        
                        // Distribute into Columns
                        const columns = Array.from({ length: Math.max(1, gridCols) }, () => [] as typeof allItems)
                        allItems.forEach((item, i) => {
                            columns[i % Math.max(1, gridCols)].push(item)
                        })

                        return columns.map((colItems, colIndex) => (
                            <div key={colIndex} className="flex-1 flex flex-col gap-4 min-w-0">
                                {colItems.map((item) => (
                                    item._type === 'queue' ? (
                                        <div key={item.id} className="relative w-full aspect-[4/3] rounded-xl bg-zinc-900/80 backdrop-blur border-2 border-[#c084fc] flex flex-col items-center justify-center overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-[#c084fc]/5 to-[#a3e635]/5 animate-pulse" />
                                            <div className="w-10 h-10 rounded-full border-2 border-[#c084fc] border-t-transparent animate-spin mb-3 relative z-10" />
                                            <div className="text-[#c084fc] text-[10px] font-bold uppercase tracking-widest mb-1 relative z-10">Generating</div>
                                            <div className="text-zinc-600 text-[9px] font-mono relative z-10 max-w-[80%] text-center truncate px-2">
                                                {item.prompt}
                                            </div>
                                            {item.count > 1 && (
                                                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-[#c084fc] text-black text-[9px] font-bold">
                                                    x{item.count}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <AssetCard 
                                            key={item.id} 
                                            asset={item as any} 
                                        />
                                    )
                                ))}
                            </div>
                        ))
                    })()}
                </div>
            )}
            
            {/* End of Stream */}
            {!isLoadingAssets && assets.length > 0 && (
                <div className="mt-16 text-center">
                     <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-600">
                         <span>{assets.length} Assets</span>
                         <span className="w-1 h-1 rounded-full bg-zinc-700" />
                         <span>End of Stream</span>
                     </div>
                </div>
            )}

        </div>
        )}

    </StudioLayout>

    {/* Floating Script Parse Button */}
    {viewMode === 'assets' && (
    <button
        onClick={() => setShowScriptModal(true)}
        className="fixed bottom-24 right-8 w-14 h-14 rounded-full bg-[#a3e635] hover:bg-[#bef264] text-black shadow-2xl shadow-[#a3e635]/30 hover:shadow-[#a3e635]/50 flex items-center justify-center transition-all hover:scale-110 active:scale-95 z-40 group"
        title="Parse Script"
    >
        <FileText size={24} className="group-hover:scale-110 transition-transform" />
    </button>
    )}

    {/* Script Parse Modal */}
    <ScriptParseModal 
        isOpen={showScriptModal}
        onClose={() => setShowScriptModal(false)}
    />
    </>
  )
}
