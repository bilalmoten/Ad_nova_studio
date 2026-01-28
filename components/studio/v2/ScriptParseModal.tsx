"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
// Imports below are correct
import { parseScriptWithLLM, analyzeVideoWithLLM } from "@/server/actions/studio/v2-llm"
import { FileText, Sparkles, X, Loader2, Video, Upload, Film } from "lucide-react"
import { useStudioStore } from "@/lib/studio/store"

interface ScriptParseModalProps {
    isOpen: boolean
    onClose: () => void
}

export function ScriptParseModal({ isOpen, onClose }: ScriptParseModalProps) {
    const [scriptText, setScriptText] = useState("")
    const [isParsing, setIsParsing] = useState(false)
    const [mode, setMode] = useState<'text' | 'video'>('text')
    const [videoFrames, setVideoFrames] = useState<string[]>([])
    const { setShots, setError, projectId } = useStudioStore()

    const extractFrames = async (file: File): Promise<string[]> => {
        return new Promise((resolve) => {
            const video = document.createElement('video')
            video.preload = 'metadata'
            video.src = URL.createObjectURL(file)
            video.muted = true
            video.playsInline = true
            
            const frames: string[] = []
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')

            video.onloadedmetadata = async () => {
                const duration = video.duration
                const count = 10
                const interval = duration / count
                
                canvas.width = 480 // Resize for easier analysis
                canvas.height = video.videoHeight * (480 / video.videoWidth)

                for (let i = 0; i < count; i++) {
                    video.currentTime = i * interval
                    await new Promise(r => video.onseeked = r)
                    if (ctx) {
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
                        frames.push(canvas.toDataURL('image/jpeg', 0.7).split(',')[1])
                    }
                }
                URL.revokeObjectURL(video.src)
                resolve(frames)
            }
        })
    }

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 50 * 1024 * 1024) {
            setError('Video too large (max 50MB)')
            return
        }

        setIsParsing(true)
        try {
            const frames = await extractFrames(file)
            setVideoFrames(frames)
        } catch (err) {
            console.error('Frame extraction failed:', err)
            setError('Failed to process video')
        } finally {
            setIsParsing(false)
        }
    }

    const handleParse = async () => {
        if (!projectId) return
        if (mode === 'text' && !scriptText.trim()) return
        if (mode === 'video' && videoFrames.length === 0) return
        
        setIsParsing(true)
        try {
            let result;
            
            if (mode === 'text') {
                result = await parseScriptWithLLM(projectId, scriptText.trim())
            } else {
                result = await analyzeVideoWithLLM(projectId, videoFrames)
            }
            
            const { data, error } = result
            
            if (error) {
                setError(error)
            } else if (data?.shots) {
                // Convert to Shot format
                const shots = data.shots.map((s: any) => ({
                    id: s.id,
                    title: s.title || s.description?.substring(0, 50) || 'Untitled',
                    description: s.description,
                    assetIds: [],
                }))
                
                setShots(shots)
                setScriptText("")
                setVideoFrames([])
                onClose()
            }
        } catch (err) {
            console.error('Parse error:', err)
            setError('Failed to parse content')
        } finally {
            setIsParsing(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-700/50 bg-gradient-to-r from-zinc-800/50 to-zinc-900/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center">
                            {mode === 'text' ? (
                                <FileText size={20} className="text-[#a3e635]" />
                            ) : (
                                <Film size={20} className="text-[#a3e635]" />
                            )}
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-zinc-100">
                                {mode === 'text' ? 'Parse Script' : 'Analyze Video'}
                            </h2>
                            <p className="text-xs text-zinc-500">
                                {mode === 'text' ? 'AI will extract shots from your script' : 'AI will breakdown video into shots'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isParsing}
                        className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex border-b border-zinc-700/50 shrink-0">
                    <button
                        onClick={() => setMode('text')}
                        className={cn(
                            "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2",
                            mode === 'text' 
                                ? "border-[#a3e635] text-[#a3e635] bg-[#a3e635]/5" 
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        )}
                    >
                        <FileText size={14} />
                        Text Script
                    </button>
                    <button
                        onClick={() => setMode('video')}
                        className={cn(
                            "flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-all border-b-2",
                            mode === 'video' 
                                ? "border-[#a3e635] text-[#a3e635] bg-[#a3e635]/5" 
                                : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
                        )}
                    >
                        <Video size={14} />
                        Video Reference
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto min-h-[300px]">
                    {mode === 'text' ? (
                        <>
                            <div className="mb-4">
                                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">
                                    Paste Your Script
                                </label>
                                <textarea
                                    value={scriptText}
                                    onChange={(e) => setScriptText(e.target.value)}
                                    placeholder={`Paste your script here. Include scene headers like:\n\nINT. COFFEE SHOP - DAY\n\nJohn enters, looking nervous...\n\nThe AI will automatically detect scenes and shots.`}
                                    rows={12}
                                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-[#a3e635]/50 focus:bg-zinc-800/70 transition-all resize-none font-mono"
                                    disabled={isParsing}
                                />
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-4 text-xs text-zinc-500 mb-4">
                                <span>{scriptText.length} characters</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-700" />
                                <span>{scriptText.split('\n').filter(l => l.trim()).length} lines</span>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full py-8 space-y-6">
                            <div className="relative group w-full max-w-sm aspect-video rounded-xl border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center bg-zinc-800/30 hover:bg-zinc-800/50 hover:border-[#a3e635]/50 transition-all cursor-pointer overflow-hidden">
                                {videoFrames.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-1 w-full h-full opacity-60">
                                        {videoFrames.slice(0, 4).map((f, i) => (
                                            <img key={i} src={`data:image/jpeg;base64,${f}`} className="w-full h-full object-cover" alt={`Frame ${i + 1}`} />
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                            <Upload size={24} className="text-zinc-400 group-hover:text-[#a3e635]" />
                                        </div>
                                        <div className="text-center px-4">
                                            <div className="text-sm font-bold text-zinc-300 mb-1">Upload Video Reference</div>
                                            <div className="text-xs text-zinc-500">
                                                AI will analyze scenes and shots
                                                <br/>
                                                <span className="text-[10px] text-zinc-600 uppercase tracking-wide mt-1 block">Max 50MB • MP4/MOV</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                />
                                {videoFrames.length > 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                        <div className="flex items-center gap-2 text-[#a3e635] font-bold bg-black/80 px-4 py-2 rounded-full">
                                            <Sparkles size={16} />
                                            <span>Ready to Analyze</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            <div className="max-w-sm text-center">
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    The AI will watch your video and break it down into a shot list with detailed visual descriptions, allowing you to recreate or iterate on the style.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Info */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50">
                        <Sparkles size={16} className="text-[#a3e635] mt-0.5 shrink-0" />
                        <div className="text-xs text-zinc-400 leading-relaxed">
                            <strong className="text-zinc-300">AI {mode === 'text' ? 'Parsing' : 'Analysis'} Features:</strong>
                            <ul className="mt-2 space-y-1 list-disc list-inside">
                                {mode === 'text' ? (
                                    <>
                                        <li>Detects scene headers (INT./EXT.)</li>
                                        <li>Identifies natural shot breaks</li>
                                        <li>Extracts descriptions and dialogue</li>
                                    </>
                                ) : (
                                    <>
                                        <li>Analyzes visual composition</li>
                                        <li>Detects camera angles and movement</li>
                                        <li>Extracts lighting and mood</li>
                                    </>
                                )}
                                <li>Generates shot IDs (1A, 2B, etc.)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-700/50 bg-zinc-900/50 shrink-0">
                    <button
                        onClick={onClose}
                        disabled={isParsing}
                        className="px-4 py-2 rounded-lg text-sm font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleParse}
                        disabled={isParsing || (mode === 'text' ? !scriptText.trim() : videoFrames.length === 0)}
                        className={cn(
                            "px-6 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all",
                            isParsing || (mode === 'text' ? !scriptText.trim() : videoFrames.length === 0)
                                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                : "bg-[#a3e635] hover:bg-[#bef264] text-black shadow-lg shadow-[#a3e635]/20 hover:shadow-[#a3e635]/30 hover:scale-[1.02] active:scale-[0.98]"
                        )}
                    >
                        {isParsing ? (
                            <>
                                <Loader2 size={14} className="animate-spin" />
                                {mode === 'text' ? 'Parsing...' : 'Analyzing...'}
                            </>
                        ) : (
                            <>
                                <Sparkles size={14} fill="currentColor" />
                                {mode === 'text' ? 'Parse Script' : 'Analyze Video'}
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    )
}
