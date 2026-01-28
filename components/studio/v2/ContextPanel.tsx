"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { User, Palette, Ban, X, Plus, Edit2 } from "lucide-react"
import { useStudioStore } from "@/lib/studio/store"
import { updateV2Project } from "@/server/actions/studio/v2-projects"
import type { V2Anchor } from "@/lib/studio/v2-types"

export function ContextPanel() {
    const { project, setProject, setError } = useStudioStore()
    const [showAnchorModal, setShowAnchorModal] = useState(false)
    const [editingAnchor, setEditingAnchor] = useState<V2Anchor | null>(null)
    
    // Get anchors from project
    const anchors: V2Anchor[] = project?.anchors || []

    const handleToggleAnchor = async (anchorId: string) => {
        if (!project) return
        
        const updatedAnchors = anchors.map(a => 
            a.id === anchorId ? { ...a, is_active: !a.is_active } : a
        )
        
        const { data, error } = await updateV2Project(project.id, {
            anchors: updatedAnchors as any,
        })
        
        if (error) {
            setError(error)
        } else if (data) {
            setProject(data)
        }
    }

    const handleDeleteAnchor = async (anchorId: string) => {
        if (!project) return
        
        const updatedAnchors = anchors.filter(a => a.id !== anchorId)
        
        const { data, error } = await updateV2Project(project.id, {
            anchors: updatedAnchors as any,
        })
        
        if (error) {
            setError(error)
        } else if (data) {
            setProject(data)
        }
    }

    const handleSaveAnchor = async (anchor: Omit<V2Anchor, 'id'>) => {
        if (!project) return
        
        const newAnchor: V2Anchor = {
            ...anchor,
            id: `anchor_${Date.now()}`,
        }
        
        const updatedAnchors = editingAnchor
            ? anchors.map(a => a.id === editingAnchor.id ? { ...newAnchor, id: editingAnchor.id } : a)
            : [...anchors, newAnchor]
        
        const { data, error } = await updateV2Project(project.id, {
            anchors: updatedAnchors,
        })
        
        if (error) {
            setError(error)
        } else if (data) {
            setProject(data)
            setShowAnchorModal(false)
            setEditingAnchor(null)
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'character': return <User size={14} />
            case 'style': return <Palette size={14} />
            case 'negative': return <Ban size={14} />
            default: return <User size={14} />
        }
    }

    return (
        <div className="h-full flex flex-col bg-zinc-900/30 backdrop-blur-xl">
            {/* Header */}
            <div className="px-4 py-5 border-b border-zinc-800/50">
                <div className="flex items-center justify-between mb-1">
                    <h2 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Global Context</h2>
                    <button
                        onClick={() => {
                            setEditingAnchor(null)
                            setShowAnchorModal(true)
                        }}
                        className="w-6 h-6 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 text-[#a3e635] hover:bg-[#a3e635]/20 flex items-center justify-center transition-all"
                        title="Add Anchor"
                    >
                        <Plus size={12} />
                    </button>
                </div>
                <p className="text-[10px] text-zinc-500">Apply to all generations</p>
            </div>

            {/* Anchors List */}
            <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                {anchors.length === 0 && (
                    <div className="text-center py-8 text-zinc-600 text-xs">
                        <div className="mb-2">No anchors yet</div>
                        <div className="text-[10px]">Add anchors to apply globally</div>
                    </div>
                )}

                {anchors.map((anchor) => (
                    <div 
                        key={anchor.id}
                        className={cn(
                            "group flex items-center gap-3 p-2.5 rounded-lg border transition-all cursor-pointer",
                            anchor.is_active
                                ? "bg-[#c084fc]/10 border-[#c084fc]/30"
                                : "bg-zinc-800/30 border-zinc-800/30 opacity-60 hover:opacity-100"
                        )}
                        onClick={() => handleToggleAnchor(anchor.id)}
                    >
                        <div className={cn(
                            "w-8 h-8 flex items-center justify-center rounded-full border",
                            anchor.is_active
                                ? "bg-[#c084fc]/10 border-[#c084fc]/20 text-[#c084fc]"
                                : "bg-zinc-800/50 border-zinc-700/30 text-zinc-500"
                        )}>
                            {getIcon(anchor.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className={cn(
                                "text-xs font-medium truncate",
                                anchor.is_active ? "text-zinc-200" : "text-zinc-400"
                            )}>
                                {anchor.label}
                            </div>
                            <div className="text-[9px] text-zinc-600 truncate">
                                {anchor.value}
                            </div>
                        </div>

                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingAnchor(anchor)
                                    setShowAnchorModal(true)
                                }}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center"
                                title="Edit"
                            >
                                <Edit2 size={10} className="text-zinc-400" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteAnchor(anchor.id)
                                }}
                                className="w-6 h-6 rounded bg-zinc-800 hover:bg-red-900/50 flex items-center justify-center"
                                title="Delete"
                            >
                                <X size={10} className="text-zinc-400 hover:text-red-400" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Anchor Modal */}
            {showAnchorModal && (
                <AnchorModal
                    anchor={editingAnchor}
                    onSave={handleSaveAnchor}
                    onClose={() => {
                        setShowAnchorModal(false)
                        setEditingAnchor(null)
                    }}
                />
            )}
        </div>
    )
}

function AnchorModal({ 
    anchor, 
    onSave, 
    onClose 
}: { 
    anchor: V2Anchor | null
    onSave: (anchor: Omit<V2Anchor, 'id'>) => void
    onClose: () => void
}) {
    const [type, setType] = useState<'character' | 'style' | 'negative'>(anchor?.type || 'character')
    const [label, setLabel] = useState(anchor?.label || '')
    const [value, setValue] = useState(anchor?.value || '')

    const handleSubmit = () => {
        if (!label.trim() || !value.trim()) return
        
        onSave({
            type,
            label: label.trim(),
            value: value.trim(),
            is_active: anchor?.is_active ?? true,
        })
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-md w-full">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700/50">
                    <h3 className="text-base font-bold text-zinc-100">
                        {anchor ? 'Edit Anchor' : 'Add Anchor'}
                    </h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Type */}
                    <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                            Type
                        </label>
                        <div className="flex gap-2">
                            {(['character', 'style', 'negative'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setType(t)}
                                    className={cn(
                                        "flex-1 py-2 px-3 rounded-lg text-xs font-medium border capitalize transition-all",
                                        type === t
                                            ? "bg-[#c084fc]/15 border-[#c084fc]/40 text-[#c084fc]"
                                            : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600"
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Label */}
                    <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                            Label
                        </label>
                        <input
                            type="text"
                            value={label}
                            onChange={(e) => setLabel(e.target.value)}
                            placeholder="e.g., Character: Neo"
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#c084fc]/50 transition-all"
                        />
                    </div>

                    {/* Value */}
                    <div>
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                            Value / Prompt
                        </label>
                        <textarea
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            placeholder="Detailed description or prompt text..."
                            rows={3}
                            className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#c084fc]/50 transition-all resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-700/50">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!label.trim() || !value.trim()}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-bold transition-all",
                            !label.trim() || !value.trim()
                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                : "bg-[#c084fc] hover:bg-[#d8b4fe] text-black shadow-lg shadow-[#c084fc]/20 hover:shadow-[#c084fc]/30 hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        {anchor ? 'Update' : 'Add'} Anchor
                    </button>
                </div>

            </div>
        </div>
    )
}
