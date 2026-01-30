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
  Loader2,
  MinusCircle,
  Settings
} from "lucide-react"
import { useStudioStore } from "@/lib/studio/store"
import { generateV2Image, generateV2Video } from "@/server/actions/studio/v2-generate"
import { uploadTempImage } from "@/server/actions/studio/v2-upload"
import { createV2Asset } from "@/server/actions/studio/v2-assets"

export function CockpitPromptBar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [batchCount, setBatchCount] = useState(1)
  const [showBatchDropdown, setShowBatchDropdown] = useState(false)
  const [showModelDropdown, setShowModelDropdown] = useState(false)
  const [showQualityDropdown, setShowQualityDropdown] = useState(false)
  const [showRatioDropdown, setShowRatioDropdown] = useState(false)
  const [showNegative, setShowNegative] = useState(false)
  const [activeTab, setActiveTab] = useState<'lighting' | 'camera' | 'format' | 'motion'>('lighting')
  const [isUploading, setIsUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  const { 
    activeShotId,
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
    
    const currentPrompt = prompt.trim()
    setPrompt('')
    setIsGenerating(true)
    
    // Enhanced prompt
    let enhancedPrompt = currentPrompt
    if (generationSettings.lighting) enhancedPrompt += `, ${generationSettings.lighting} lighting`
    if (generationSettings.cameraAngle || generationSettings.lens) enhancedPrompt += `, ${generationSettings.cameraAngle || ''} ${generationSettings.lens || ''} camera view`

    // Dimensions
    let width = 1024, height = 1024
    const is4k = generationSettings.resolution === '4k'
    const is720p = generationSettings.resolution === '720p'

    switch (generationSettings.aspectRatio) {
        case '16:9':
            width = is4k ? 3840 : is720p ? 1280 : 1920
            height = is4k ? 2160 : is720p ? 720 : 1080
            break
        case '9:16':
            width = is4k ? 2160 : is720p ? 720 : 1080
            height = is4k ? 3840 : is720p ? 1280 : 1920
            break
        case '4:5':
            width = is4k ? 2160 : is720p ? 720 : 1080
            height = is4k ? 2700 : is720p ? 900 : 1350
            break
        case '1:1':
        default:
            width = is4k ? 2048 : is720p ? 768 : 1024
            height = is4k ? 2048 : is720p ? 768 : 1024
            break
    }

    try {
      if (generationMode === 'image') {
          const result = await generateV2Image(projectId, {
            prompt: enhancedPrompt,
            shot_id: activeShotId || undefined,
            width,
            height,
            quality: generationSettings.quality || 'auto',
            negative_prompt: generationSettings.negativePrompt,
            seed: generationSettings.seed,
            reference_urls: referenceImages,
            count: batchCount,
            output_format: generationSettings.format,
           output_compression: generationSettings.compression,
            background: generationSettings.background,
          })

          if (result.error) setError(result.error)
          else if (result.data) result.data.forEach(asset => addAsset(asset))

      } else {
          const promises = Array.from({ length: batchCount }, async () => {
             return await generateV2Video(projectId, {
                prompt: enhancedPrompt,
                shot_id: activeShotId || undefined,
                duration: generationSettings.duration || 4,
                image_url: referenceImages[0],
             })
          })

          const results = await Promise.all(promises)
          results.forEach(({ data, error }) => {
            if (error) setError(error)
            else if (data) data.forEach(asset => addAsset(asset))
          })
      }
      
    } catch {
      console.error('Generation error')
      setError('Generation failed')
    } finally {
      setIsGenerating(false)
    }
  }

  const persistUpload = async (file: File) => {
      setIsUploading(true)
      try {
          const formData = new FormData()
          formData.append('file', file)
          const { url, error } = await uploadTempImage(formData)
          
          if (error || !url) {
            setError(error || 'Failed to upload image')
            return
          }

          const { data: newAsset, error: dbError } = await createV2Asset({
              project_id: projectId!,
              type: 'image', 
              media_url: url,
              metadata: { prompt: file.name, is_upload: true, width: 0, height: 0 },
              is_temporary: false
          })
          
          if (dbError || !newAsset) console.error("Failed to save asset DB record", dbError)
          else addAsset(newAsset)

          addReferenceImage(url)
      } catch (err) {
          console.error('Upload error', err)
          setError('Upload failed')
      } finally {
          setIsUploading(false)
      }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !projectId) return
    await persistUpload(file)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  const handlePaste = async (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
          if (item.type.startsWith('image/')) {
              const file = item.getAsFile()
              if (file && projectId) {
                  e.preventDefault()
                  await persistUpload(file)
                  return
              }
          }
      }
  }

  return (
    <div className="w-full max-w-7xl mx-auto font-sans relative z-50">
      <div 
        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy' }}
        onDrop={(e) => {
            e.preventDefault()
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'))
                if (data.type === 'asset') {
                    if (data.prompt) setPrompt(prompt ? `${prompt} ${data.prompt}` : data.prompt)
                    if (data.mediaType === 'image' && data.url && !referenceImages.includes(data.url)) {
                        addReferenceImage(data.url)
                    }
                }
            } catch {}
        }}
        className={cn(
            "backdrop-blur-xl bg-black/90 border border-zinc-800 shadow-2xl shadow-black/80 transition-all duration-300 relative z-20",
            isExpanded ? "rounded-[32px] p-1" : "rounded-[26px]"
        )}
      >
        {/* TOP ROW: References + Mode Toggle */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-zinc-800/30">
            {/* Left: References */}
            <div className="flex items-center gap-2">
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {referenceImages.map((url, idx) => (
                    <div key={idx} className="relative group w-10 h-10 flex items-center justify-center transition-all">
                        <img src={url} alt="ref" className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10 bg-zinc-900" />
                        <button
                            onClick={() => removeReferenceImage(url)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                        >
                            <X size={10} className="text-white" />
                        </button>
                    </div>
                ))}
                
                <button 
                    onClick={() => imageInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-10 h-10 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 border-dashed border border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all"
                    title="Add Reference"
                >
                    {isUploading ? <Loader2 size={16} className="animate-spin text-[#c084fc]" /> : <ImageIcon size={16} />}
                </button>
            </div>

            {/* Right: Mode Toggle */}
            <div className="flex bg-zinc-900 p-1 rounded-full border border-zinc-800">
                <button 
                    onClick={() => setGenerationMode('image')}
                    className={cn(
                        "px-4 py-1.5 text-[11px] font-bold rounded-full transition-all tracking-wide flex items-center gap-1.5",
                        generationMode === 'image' ? "bg-zinc-800 text-zinc-100 shadow-sm ring-1 ring-white/5" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    <ImageIcon size={13} />
                    IMAGE
                </button>
                <button 
                    onClick={() => setGenerationMode('video')}
                    className={cn(
                        "px-4 py-1.5 text-[11px] font-bold rounded-full transition-all tracking-wide flex items-center gap-1.5",
                        generationMode === 'video' ? "bg-zinc-800 text-zinc-100 shadow-sm ring-1 ring-white/5" : "text-zinc-500 hover:text-zinc-300"
                    )}
                >
                    <Video size={13} />
                    VIDEO
                </button>
            </div>
        </div>

        {/* MIDDLE: Prompt Input */}
        <div className="px-4 py-3">
             <textarea
                ref={textareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onPaste={handlePaste}
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
             
             {/* Negative Prompt */}
             {showNegative && (
                 <div className="mt-2 animate-in fade-in slide-in-from-top-1">
                    <input
                        value={generationSettings.negativePrompt || ''}
                        onChange={(e) => updateGenerationSettings({ negativePrompt: e.target.value })}
                        placeholder="Negative prompt..."
                        className="w-full bg-zinc-900 text-zinc-300 placeholder:text-zinc-600 text-sm px-3 py-2 rounded-lg border border-zinc-800 focus:border-zinc-600 outline-none transition-all"
                    />
                 </div>
             )}
        </div>

        {/* BOTTOM ROW: Controls */}
        <div className="flex items-center justify-between px-4 pb-3 pt-2 border-t border-zinc-800/30">
            <div className="flex items-center gap-2">
                {/* Model Selector */}
                <div className="relative">
                    <button
                        onClick={() => setShowModelDropdown(!showModelDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-[11px] font-bold text-zinc-300"
                    >
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
                            : (generationMode === 'video' ? 'Veo 3.1' : 'GPT Image 1.5')}
                        <ChevronDown size={10} />
                    </button>
                    {showModelDropdown && (
                        <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowModelDropdown(false)} />
                        <div className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-40 p-1 min-w-[140px] flex flex-col gap-0.5">
                            {(generationMode === 'video' 
                                ? [
                                    { id: 'veo-3.1-fast-generate-preview', label: 'Veo 3.1' },
                                    { id: 'sora-2', label: 'Sora 2' }
                                  ]
                                : [
                                    { id: 'gemini-3-pro-image-preview', label: 'Nano Banana Pro' },
                                    { id: 'gpt-image-1', label: 'GPT Image 1.5' }
                                  ]
                            ).map((model) => (
                                <button
                                    key={model.id}
                                    onClick={() => { updateGenerationSettings({ model: model.id }); setShowModelDropdown(false) }}
                                    className={cn(
                                        "w-full px-3 py-1.5 rounded text-[10px] font-medium text-left transition-all",
                                        generationSettings.model === model.id ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50"
                                    )}
                                >
                                    {model.label}
                                </button>
                            ))}
                        </div>
                        </>
                    )}
                </div>

                {/* Batch Count */}
                <div className="relative">
                    <button
                        onClick={() => setShowBatchDropdown(!showBatchDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-[11px] font-bold text-zinc-300"
                    >
                        <Hash size={12} />
                        {batchCount}
                    </button>
                    {showBatchDropdown && (
                        <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowBatchDropdown(false)} />
                        <div className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-40 p-1 min-w-[50px] flex flex-col gap-0.5">
                            {[1, 2, 3, 4].map((count) => (
                                <button
                                    key={count}
                                    onClick={() => { setBatchCount(count); setShowBatchDropdown(false) }}
                                    className={cn(
                                        "w-full px-2 py-1.5 rounded text-[10px] font-medium text-center transition-all",
                                        batchCount === count ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50"
                                    )}
                                >
                                    {count}
                                </button>
                            ))}
                        </div>
                        </>
                    )}
                </div>

                {/* Quality */}
                <div className="relative">
                    <button
                        onClick={() => setShowQualityDropdown(!showQualityDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-[11px] font-bold text-zinc-300"
                    >
                        {(generationSettings.quality || 'auto').toUpperCase()}
                        <ChevronDown size={10} />
                    </button>
                    {showQualityDropdown && (
                        <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowQualityDropdown(false)} />
                        <div className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-40 p-1 min-w-[80px]">
                            {(['low', 'medium', 'high', 'auto'] as const).map((q) => (
                                <button
                                    key={q}
                                    onClick={() => { updateGenerationSettings({ quality: q }); setShowQualityDropdown(false) }}
                                    className={cn(
                                        "w-full px-3 py-1.5 rounded text-[10px] font-medium text-left transition-all",
                                        generationSettings.quality === q ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50"
                                    )}
                                >
                                    {q.charAt(0).toUpperCase() + q.slice(1)}
                                </button>
                            ))}
                        </div>
                        </>
                    )}
                </div>

                {/* Aspect Ratio */}
                <div className="relative">
                    <button
                        onClick={() => setShowRatioDropdown(!showRatioDropdown)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-all text-[11px] font-bold text-zinc-300"
                    >
                        {generationSettings.aspectRatio || '1:1'}
                        <ChevronDown size={10} />
                    </button>
                    {showRatioDropdown && (
                        <>
                        <div className="fixed inset-0 z-30" onClick={() => setShowRatioDropdown(false)} />
                        <div className="absolute bottom-full left-0 mb-2 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-40 p-1 min-w-[100px]">
                            {['16:9', '9:16', '1:1', '4:5'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => { updateGenerationSettings({ aspectRatio: r as any }); setShowRatioDropdown(false) }}
                                    className={cn(
                                        "w-full px-3 py-1.5 rounded text-[10px] font-medium text-left transition-all",
                                        generationSettings.aspectRatio === r ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:bg-zinc-800/50"
                                    )}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                        </>
                    )}
                </div>

                <div className="w-px h-6 bg-zinc-800" />

                {/* Negative Prompt Toggle */}
                <button 
                    onClick={() => setShowNegative(!showNegative)}
                    className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full transition-all",
                        showNegative ? "text-red-400 bg-red-500/10" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
                    )}
                    title="Negative Prompt"
                >
                    <MinusCircle size={16} />
                </button>

                {/* Expand Settings */}
                <button 
                   onClick={() => setIsExpanded(!isExpanded)}
                   className={cn(
                       "w-8 h-8 flex items-center justify-center rounded-full transition-all",
                       isExpanded ? "text-[#c084fc] bg-[#c084fc]/10" : "text-zinc-600 hover:text-zinc-300 hover:bg-white/5"
                   )}
                   title="Advanced Settings"
                >
                   {isExpanded ? <ChevronDown size={16} /> : <Settings size={16} />}
                </button>
            </div>

            {/* Generate Button */}
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
                {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} fill="currentColor" />}
                <span>GENERATE</span>
            </button>
        </div>

        {/* EXPANDED: CONTROL TABS */}
        {isExpanded && (
            <div className="border-t border-zinc-700/30">
                <div className="flex bg-zinc-900/50">
                    <TabButton icon={<Sun size={13} />} label="Lighting" active={activeTab === 'lighting'} onClick={() => setActiveTab('lighting')} />
                    <TabButton icon={<Camera size={13} />} label="Camera" active={activeTab === 'camera'} onClick={() => setActiveTab('camera')} />
                    <TabButton icon={<Expand size={13} />} label="Format" active={activeTab === 'format'} onClick={() => setActiveTab('format')} />
                    {generationMode === 'video' && <TabButton icon={<Video size={13} />} label="Motion" active={activeTab === 'motion'} onClick={() => setActiveTab('motion')} />}
                </div>
                
                <div className="p-6 bg-zinc-900/30">
                    {activeTab === 'lighting' && <LightingTab value={generationSettings.lighting} onChange={(v) => updateGenerationSettings({ lighting: v })} />}
                    {activeTab === 'camera' && <CameraTab angle={generationSettings.cameraAngle} lens={generationSettings.lens} onAngleChange={(v) => updateGenerationSettings({ cameraAngle: v })} onLensChange={(v) => updateGenerationSettings({ lens: v })} />}
                    {activeTab === 'format' && (
                        <FormatTab 
                            aspectRatio={generationSettings.aspectRatio}
                            resolution={generationSettings.resolution}
                            quality={generationSettings.quality}
                            format={generationSettings.format}
                            compression={generationSettings.compression}
                            background={generationSettings.background}
                            onAspectRatioChange={(v) => updateGenerationSettings({ aspectRatio: v })}
                            onResolutionChange={(v) => updateGenerationSettings({ resolution: v })}
                            onQualityChange={(v) => updateGenerationSettings({ quality: v })}
                            onFormatChange={(v) => updateGenerationSettings({ format: v })}
                            onCompressionChange={(v) => updateGenerationSettings({ compression: v })}
                            onBackgroundChange={(v) => updateGenerationSettings({ background: v })}
                        />
                    )}
                    {activeTab === 'motion' && generationMode === 'video' && <MotionTab duration={generationSettings.duration} onDurationChange={(v) => updateGenerationSettings({ duration: v })} />}
                </div>
            </div>
        )}
      </div>
    </div>
  )
}

// SUB-COMPONENTS (same as original)
function LightingTab({ value, onChange }: { value?: string; onChange: (v: string) => void }) {
    const presets = ['Natural', 'Golden Hour', 'Neon', 'Studio', 'Dramatic', 'Low Key']
    return (
        <>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Lighting Preset</div>
            <div className="flex flex-wrap gap-2">
                {presets.map((preset) => <PresetButton key={preset} label={preset} active={value === preset} onClick={() => onChange(preset)} />)}
            </div>
        </>
    )
}

function CameraTab({ angle, lens, onAngleChange, onLensChange }: { angle?: string; lens?: string; onAngleChange: (v: any) => void; onLensChange: (v: any) => void }) {
    const angles = ['Eye Level', 'High', 'Low', 'Dutch']
    const lenses = ['Wide', 'Normal', 'Telephoto']
    
    return (
        <>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Camera Angle</div>
            <div className="flex flex-wrap gap-2 mb-6">
                {angles.map((a) => <PresetButton key={a} label={a} active={angle === a.toLowerCase().replace(' ', '-')} onClick={() => onAngleChange(a.toLowerCase().replace(' ', '-'))} />)}
            </div>
            
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Lens</div>
            <div className="flex flex-wrap gap-2">
                {lenses.map((l) => <PresetButton key={l} label={l} active={lens === l.toLowerCase()} onClick={() => onLensChange(l.toLowerCase())} />)}
            </div>
        </>
    )
}

function FormatTab({ aspectRatio, resolution, quality, format, compression, background, onAspectRatioChange, onResolutionChange, onQualityChange, onFormatChange, onCompressionChange, onBackgroundChange }: { aspectRatio?: string; resolution?: string; quality?: string; format?: string; compression?: number; background?: string; onAspectRatioChange: (v: any) => void; onResolutionChange: (v: any) => void; onQualityChange: (v: any) => void; onFormatChange: (v: any) => void; onCompressionChange: (v: any) => void; onBackgroundChange: (v: any) => void; }) {
    const ratios = ['16:9', '9:16', '1:1', '4:5']
    const resolutions = ['720p', '1080p', '4k']
    const qualities = ['low', 'medium', 'high', 'auto']
    const formats = ['jpeg', 'png']
    
    return (
        <>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Aspect Ratio</div>
            <div className="flex flex-wrap gap-2 mb-6">
                {ratios.map((r) => <PresetButton key={r} label={r} active={aspectRatio === r} onClick={() => onAspectRatioChange(r)} />)}
            </div>
            
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Resolution</div>
            <div className="flex flex-wrap gap-2 mb-6">
                {resolutions.map((res) => <PresetButton key={res} label={res} active={resolution === res} onClick={() => onResolutionChange(res)} />)}
            </div>
            
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Quality</div>
            <div className="flex flex-wrap gap-2 mb-6">
                {qualities.map((q) => <PresetButton key={q} label={q.charAt(0).toUpperCase() + q.slice(1)} active={quality === q} onClick={() => onQualityChange(q)} />)}
            </div>
            
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Format</div>
            <div className="flex flex-wrap gap-2 mb-6">
                {formats.map((f) => <PresetButton key={f} label={f.toUpperCase()} active={format === f} onClick={() => onFormatChange(f)} />)}
            </div>
            
            {(format === 'jpeg' ) && (
                <>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Compression</div>
                    <div className="flex items-center gap-3 mb-4">
                        <input type="range" min="0" max="100" value={compression ?? 85} onChange={(e) => onCompressionChange(Number(e.target.value))} className="flex-1 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#a3e635]" />
                        <span className="text-xs font-bold text-zinc-300 w-12 text-right">{compression ?? 85}%</span>
                    </div>
                </>
            )}
            
            {format === 'png' && (
                <>
                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Background</div>
                    <div className="flex gap-2 mb-4">
                        <PresetButton label="Opaque" active={!background || background !== 'transparent'} onClick={() => onBackgroundChange(undefined)} />
                        <PresetButton label="Transparent" active={background === 'transparent'} onClick={() => onBackgroundChange('transparent')} />
                    </div>
                </>
            )}
        </>
    )
}

function MotionTab({ duration, onDurationChange }: { duration?: number; onDurationChange: (v: 4 | 6 | 8) => void }) {
    const durations = [4, 6, 8]
    return (
        <>
            <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-3">Duration</div>
            <div className="flex flex-wrap gap-2">
                {durations.map((d) => <PresetButton key={d} label={`${d}s`} active={duration === d} onClick={() => onDurationChange(d as 4 | 6 | 8)} />)}
            </div>
        </>
    )
}

function TabButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick?: () => void }) {
    return (
        <button onClick={onClick} className={cn("flex-1 py-3.5 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-wider transition-all border-b-2", active ? "text-[#a3e635] border-[#a3e635] bg-[#a3e635]/5" : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-800/30")}>
            {icon}
            {label}
        </button>
    )
}

function PresetButton({ label, active, onClick }: { label: string; active?: boolean; onClick?: () => void }) {
    return (
        <button onClick={onClick} className={cn("px-4 py-2 rounded-lg text-[12px] font-medium transition-all border", active ? "bg-[#a3e635]/15 border-[#a3e635]/40 text-[#a3e635] ring-2 ring-[#a3e635]/10" : "bg-zinc-800/50 border-zinc-700/50 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800")}>
            {label}
        </button>
    )
}
