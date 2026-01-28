"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { 
  ChevronDown,
  Sparkles,
  Sun,
  Camera,
  Expand,
  Video,
  Image as ImageIcon,
  X,
  Hash,
  Loader2
} from "lucide-react"
import { useStudioStore } from "@/lib/studio/store"
import { generateV2Image, generateV2Video } from "@/server/actions/studio/v2-generate"
import { uploadTempImage } from "@/server/actions/studio/v2-upload"
// import type { V2Asset } from "@/lib/studio/v2-types"

export function CockpitPromptBar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [batchCount, setBatchCount] = useState(1)
  const [showBatchDropdown, setShowBatchDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState<'lighting' | 'camera' | 'format' | 'motion'>('lighting')
  const [isUploading, setIsUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { 
    activeShotId,
    // shots,
    isGenerating, 
    setIsGenerating,
    projectId,
    addAsset,
    setError,
    generationMode,
    setGenerationMode,
    generationSettings,
    updateGenerationSettings,
    referenceImages,
    addReferenceImage,
    removeReferenceImage,
    prompt,
    setPrompt
  } = useStudioStore()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [prompt])

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    if (!projectId) {
      setError('No project loaded')
      return
    }
    
    // Don't block - allow multiple concurrent generations
    const currentPrompt = prompt.trim()
    setPrompt('') // Clear immediately for next input
    setIsGenerating(true) // Set loading state
    
    try {
      // Generate batch concurrently
      const promises = Array.from({ length: batchCount }, async () => {
        if (generationMode === 'image') {
          return await generateV2Image(projectId, {
            prompt: currentPrompt,
            shot_id: activeShotId || undefined,
            width: generationSettings.aspectRatio === '16:9' ? 1920 : generationSettings.aspectRatio === '9:16' ? 1080 : 1024,
            height: generationSettings.aspectRatio === '16:9' ? 1080 : generationSettings.aspectRatio === '9:16' ? 1920 : 1024,
            negative_prompt: generationSettings.negativePrompt,
            seed: generationSettings.seed,
            reference_url: referenceImages[0],
          })
        } else {
          return await generateV2Video(projectId, {
            prompt: currentPrompt,
            shot_id: activeShotId || undefined,
            duration: generationSettings.duration || 4,
            image_url: referenceImages[0],
          })
        }
      })
      
      const results = await Promise.all(promises)
      
      // Add all successful assets
      results.forEach(({ data, error }) => {
        if (error) {
          setError(error)
        } else if (data) {
          addAsset(data)
        }
      })
      
    } catch {
      console.error('Generation error')
      setError('Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const { url, error } = await uploadTempImage(formData)
      
      if (error || !url) {
        setError(error || 'Failed to upload image')
      } else {
        addReferenceImage(url)
      }
    } catch {
      console.error('Upload error')
      setError('Upload failed')
    } finally {
      setIsUploading(false)
      // Reset input
      if (imageInputRef.current) {
        imageInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="w-full max-w-3xl mx-auto font-sans relative z-50 flex items-end gap-3 px-4">
      
      {/* LEFT: VERTICAL CONTROLS PILL */}
      <div className="flex flex-col items-center gap-2 p-1.5 backdrop-blur-xl bg-black/90 border border-zinc-800 shadow-2xl shadow-black/50 rounded-full mb-[1px]">
            {/* Mode Switcher */}
            <div className="flex flex-col gap-1 bg-zinc-900/50 rounded-full p-1 border border-white/5">
                <button
                    onClick={() => setGenerationMode('image')}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full transition-all",
                        generationMode === 'image' ? "bg-[#a3e635] text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    title="Image Mode"
                >
                    <ImageIcon size={14} />
                </button>
                <button
                    onClick={() => setGenerationMode('video')}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full transition-all",
                        generationMode === 'video' ? "bg-[#c084fc] text-black shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                    )}
                    title="Video Mode"
                >
                    <Video size={14} />
                </button>
            </div>

            <div className="w-4 h-px bg-zinc-800" />

            {/* Batch Count */}
            <div className="relative">
                <button
                    onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                    className="flex flex-col items-center justify-center w-8 h-8 rounded-full hover:bg-zinc-800 transition-colors"
                >
                    <Hash size={12} className="text-zinc-500 mb-[-2px]" />
                    <span className="text-[10px] font-bold text-zinc-300 leading-none">{batchCount}</span>
                </button>
                {showBatchDropdown && (
                        <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowBatchDropdown(false)} />
                        <div className="absolute left-full bottom-0 ml-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-40 p-1 min-w-[50px] flex flex-col gap-0.5">
                            {[1, 2, 3, 4].map((count) => (
                                <button
                                    key={count}
                                    onClick={() => {
                                        setBatchCount(count)
                                        setShowBatchDropdown(false)
                                    }}
                                    className={cn(
                                        "w-full px-2 py-1.5 rounded text-[10px] font-medium text-center transition-all",
                                        batchCount === count
                                            ? "bg-zinc-800 text-zinc-100"
                                            : "text-zinc-400 hover:bg-zinc-800/50"
                                    )}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                        </>
                    )}
            </div>

            {/* Ref Image */}
            <div className="relative">
                 {referenceImages.length > 0 ? (
                    <div className="relative group w-8 h-8 flex items-center justify-center">
                        <img src={referenceImages[0]} alt="ref" className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10" />
                        <button
                            onClick={() => removeReferenceImage(referenceImages[0])}
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <X size={8} className="text-white" />
                        </button>
                    </div>
                 ) : (
                    <button 
                            onClick={() => imageInputRef.current?.click()}
                            disabled={isUploading}
                            className="w-8 h-8 rounded-full hover:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all relative overflow-hidden"
                            title="Add Reference"
                    >
                        {isUploading ? (
                            <Loader2 size={14} className="animate-spin text-[#c084fc]" />
                        ) : (
                            <ImageIcon size={16} />
                        )}
                    </button>
                 )}
            </div>
      </div>

      {/* CENTER: MAIN INPUT PILL */}
      <div 
        onDragOver={(e) => {
            e.preventDefault()
            e.dataTransfer.dropEffect = 'copy'
        }}
        onDrop={(e) => {
            e.preventDefault()
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'))
                if (data.type === 'asset') {
                    // Append prompt
                    if (data.prompt) {
                        setPrompt(prompt ? `${prompt} ${data.prompt}` : data.prompt)
                    }
                    // Add as reference if image
                    if (data.mediaType === 'image' && data.url) {
                        if (!referenceImages.includes(data.url)) {
                            addReferenceImage(data.url)
                        }
                    }
                }
            } catch {
                // Ignore non-JSON drops
            }
        }}
        className={cn(
            "flex-1 backdrop-blur-xl bg-black/90 border border-zinc-800 shadow-2xl shadow-black/80 transition-all duration-300 relative z-20",
            isExpanded ? "rounded-[32px] p-1" : "rounded-[26px]"
        )}
      >
        <div className="flex items-center px-4 py-2 gap-3 min-h-[56px]">
            
            {/* Input */}
            <div className="flex-1 relative">
                 <input
                     ref={imageInputRef}
                     type="file"
                     accept="image/*"
                     onChange={handleImageUpload}
                     className="hidden"
                 />
                 <textarea
                    ref={textareaRef}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault()
                        handleGenerate()
                      }
                    }}
                    placeholder={generationMode === 'video' ? "Describe your video..." : "Describe your image..."}
                    className="w-full bg-transparent border-none py-2 text-[15px] font-medium text-zinc-100 placeholder:text-zinc-600 outline-none resize-none h-auto max-h-[120px] leading-relaxed scrollbar-hide"
                    rows={1}
                 />
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2">
                 
                 {/* Model Selector */}
                 <div className="relative group/model">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-[11px] font-bold text-zinc-300">
                        <span>
                            {generationSettings.model 
                                ? (generationMode === 'video' 
                                    ? [
                                        { id: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1' },
                                        { id: 'sora-2', label: 'Sora 2' }
                                      ].find(m => m.id === generationSettings.model)?.label || 'Veo 3.1'
                                    : [
                                        { id: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro' },
                                        { id: 'gpt-image-1', label: 'GPT Image 1.5' }
                                      ].find(m => m.id === generationSettings.model)?.label || 'GPT Image 1.5')
                                : (generationMode === 'video' ? 'Sora 2' : 'GPT Image 1.5')}
                        </span>
                        <ChevronDown size={10} className="text-zinc-500" />
                    </button>
                    
                    {/* Model Dropdown */}
                    <div className="absolute bottom-full right-0 mb-2 w-32 bg-zinc-900 border border-zinc-800 rounded-xl shadow-xl p-1 opacity-0 pointer-events-none group-hover/model:opacity-100 group-hover/model:pointer-events-auto transition-all transform translate-y-2 group-hover/model:translate-y-0 z-50">
                        {(generationMode === 'video' 
                            ? [
                                { id: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1' },
                                { id: 'sora-2', label: 'Sora 2' }
                              ]
                            : [
                                { id: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro' },
                                { id: 'gpt-image-1', label: 'GPT Image 1.5' }
                              ]
                        ).map(model => (
                            <button
                                key={model.id}
                                onClick={() => updateGenerationSettings({ model: model.id })}
                                className={cn(
                                    "w-full text-left px-2 py-1.5 rounded text-[10px] font-medium transition-colors",
                                    generationSettings.model === model.id
                                        ? "bg-zinc-800 text-zinc-100"
                                        : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
                                )}
                            >
                                {model.label}
                            </button>
                        ))}
                    </div>
                 </div>

                 <div className="w-px h-6 bg-zinc-800" />

                 <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full transition-all text-zinc-600 hover:text-zinc-300 hover:bg-white/5",
                        isExpanded && "text-[#c084fc] bg-[#c084fc]/10"
                    )}
                 >
                    {isExpanded ? <ChevronDown size={16} /> : <Sun size={16} />}
                 </button>

                 <button 
                    onClick={handleGenerate}
                    disabled={!prompt.trim()}
                    className={cn(
                        "h-[36px] px-4 rounded-full font-bold text-[12px] flex items-center gap-2 transition-all shadow-lg hover:scale-105 active:scale-95 tracking-wide",
                        !prompt.trim()
                            ? "bg-zinc-800 text-zinc-600 cursor-not-allowed"
                            : "bg-[#c084fc] hover:bg-[#d8b4fe] text-black shadow-[#c084fc]/20"
                    )}
                 >
                     {isGenerating ? (
                        <Loader2 size={14} className="animate-spin" />
                     ) : (
                        <Sparkles size={14} fill="currentColor" />
                     )}
                     <span>GENERATE</span>
                 </button>
            </div>
        </div>
        
        {/* EXPANDED: CONTROL TABS */}
        {isExpanded && (
            <div className="border-t border-zinc-700/30">
                
                {/* Tab Row */}
                <div className="flex bg-zinc-900/50">
                    <TabButton icon={<Sun size={13} />} label="Lighting" active={activeTab === 'lighting'} onClick={() => setActiveTab('lighting')} />
                    <TabButton icon={<Camera size={13} />} label="Camera" active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} />
                    <TabButton icon={<Expand size={13} />} label="Format" active={activeTab === 'format'} onClick={() => setActiveTab('format')} />
                    {generationMode === 'video' && (
                        <TabButton icon={<Video size={13} />} label="Motion" active={activeTab === 'motion'} onClick={() => setActiveTab('motion')} />
                    )}
                </div>
                
                {/* Tab Content */}
                <div className="p-6 bg-zinc-900/30">
                    {activeTab === 'lighting' && (
                        <LightingTab 
                            value={generationSettings.lighting}
                            onChange={(v) => updateGenerationSettings({ lighting: v })}
                        />
                    )}
                    {activeTab === 'camera' && (
                        <CameraTab 
                            angle={generationSettings.cameraAngle}
                            lens={generationSettings.lens}
                            onAngleChange={(v) => updateGenerationSettings({ cameraAngle: v })}
                            onLensChange={(v) => updateGenerationSettings({ lens: v })}
                        />
                    )}
                    {activeTab === 'format' && (
                        <FormatTab 
                            aspectRatio={generationSettings.aspectRatio}
                            resolution={generationSettings.resolution}
                            onAspectRatioChange={(v) => updateGenerationSettings({ aspectRatio: v })}
                            onResolutionChange={(v) => updateGenerationSettings({ resolution: v })}
                        />
                    )}
                    {activeTab === 'motion' && generationMode === 'video' && (
                        <MotionTab 
                            duration={generationSettings.duration}
                            onDurationChange={(v) => updateGenerationSettings({ duration: v })}
                        />
                    )}
                </div>
                
            </div>
        )}

      </div>

    </div>
  )
}

function LightingTab({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
    const presets = ['Natural', 'Golden Hour', 'Neon', 'Studio', 'Dramatic', 'Low Key']
    return (
        <>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Lighting Preset</div>
            <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                    <PresetButton 
                        key={preset}
                        label={preset} 
                        active={value === preset}
                        onClick={() => onChange(preset)}
                    />
                ))}
            </div>
        </>
    )
}

function CameraTab({ 
    angle, 
    lens, 
    onAngleChange, 
    onLensChange 
}: { 
    angle?: string; 
    lens?: string; 
    onAngleChange: (v: any) => void; 
    onLensChange: (v: any) => void 
}) {
    const angles = ['Eye Level', 'High', 'Low', 'Dutch']
    const lenses = ['Wide', 'Normal', 'Telephoto']
    
    return (
        <>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Camera Angle</div>
            <div className="flex flex-wrap gap-2 mb-6">
                {angles.map((a) => (
                    <PresetButton 
                        key={a}
                        label={a} 
                        active={angle === a.toLowerCase().replace(' ', '-')}
                        onClick={() => onAngleChange(a.toLowerCase().replace(' ', '-'))}
                    />
                ))}
            </div>
            
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Lens</div>
            <div className="flex flex-wrap gap-2">
                {lenses.map((l) => (
                    <PresetButton 
                        key={l}
                        label={l} 
                        active={lens === l.toLowerCase()}
                        onClick={() => onLensChange(l.toLowerCase())}
                    />
                ))}
            </div>
        </>
    )
}

function FormatTab({ 
    aspectRatio, 
    resolution, 
    onAspectRatioChange, 
    onResolutionChange 
}: { 
    aspectRatio?: string; 
    resolution?: string; 
    onAspectRatioChange: (v: any) => void; 
    onResolutionChange: (v: any) => void 
}) {
    const ratios = ['16:9', '9:16', '1:1', '4:5']
    const resolutions = ['720p', '1080p', '4k']
    
    return (
        <>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Aspect Ratio</div>
            <div className="flex flex-wrap gap-2 mb-6">
                {ratios.map((r) => (
                    <PresetButton 
                        key={r}
                        label={r} 
                        active={aspectRatio === r}
                        onClick={() => onAspectRatioChange(r)}
                    />
                ))}
            </div>
            
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Resolution</div>
            <div className="flex flex-wrap gap-2">
                {resolutions.map((res) => (
                    <PresetButton 
                        key={res}
                        label={res} 
                        active={resolution === res}
                        onClick={() => onResolutionChange(res)}
                    />
                ))}
            </div>
        </>
    )
}

function MotionTab({ duration, onDurationChange }: { duration?: number; onDurationChange: (v: 4 | 6 | 8) => void }) {
    const durations = [4, 6, 8]
    
    return (
        <>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Duration</div>
            <div className="flex flex-wrap gap-2">
                {durations.map((d) => (
                    <PresetButton 
                        key={d}
                        label={`${d}s`} 
                        active={duration === d}
                        onClick={() => onDurationChange(d as 4 | 6 | 8)}
                    />
                ))}
            </div>
        </>
    )
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "flex-1 py-3.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2",
                active 
                    ? "text-[#a3e635] border-[#a3e635] bg-[#a3e635]/5" 
                    : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30"
            )}
        >
            {icon}
            {label}
        </button>
    )
}

function PresetButton({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
    return (
        <button 
            onClick={onClick}
            className={cn(
                "px-4 py-2 rounded-lg text-[12px] font-medium transition-all border",
                active 
                    ? "bg-[#a3e635]/15 border-[#a3e635]/40 text-[#a3e635] ring-2 ring-[#a3e635]/10" 
                    : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
            )}
        >
            {label}
        </button>
    )
}
