'use client'

import { useState, useEffect } from 'react'
import { useStudioStore } from '@/lib/dashboard2/store'
import { useHeroImages } from '@/lib/dashboard2/hooks'
import { StepHeader } from '../step-header'
import { GlassCard } from '../../ui/glass-card'
import { GradientButton } from '../../ui/gradient-button'
import { getGradientFromId } from '@/lib/dashboard2/utils'
import { 
  Image as ImageIcon, 
  Check, 
  RefreshCw, 
  Upload, 
  Download, 
  Copy, 
  ArrowRight, 
  Pencil, 
  Tag, 
  X,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import type { StudioHeroImage } from '@/lib/studio/types'

interface LabeledImage {
  id: string
  url: string
  prompt: string
  label: string
}

export function HeroImageSelector() {
  const { currentProject } = useStudioStore()
  const { toast } = useToast()
  const projectId = currentProject?.id || ''
  
  const { 
    heroImages, 
    isGenerating, 
    generate, 
    selectImages, 
    regenerate 
  } = useHeroImages(projectId)
  
  const [selectedImages, setSelectedImages] = useState<LabeledImage[]>([])
  const [prompt, setPrompt] = useState('')
  const [editMode, setEditMode] = useState(false)
  const [editingImage, setEditingImage] = useState<StudioHeroImage | null>(null)
  const [showLabelPanel, setShowLabelPanel] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  
  // Generate hero images on first load if none exist
  useEffect(() => {
    if (projectId && heroImages.length === 0 && isInitialLoad && currentProject?.selected_concept) {
      setIsInitialLoad(false)
      generate()
    }
  }, [projectId, heroImages.length, isInitialLoad, currentProject?.selected_concept, generate])

  // Initialize selected from project
  useEffect(() => {
    if (currentProject?.selected_hero_images?.length) {
      setSelectedImages(currentProject.selected_hero_images)
    }
  }, [currentProject?.selected_hero_images])
  
  const handleSelect = (image: StudioHeroImage) => {
    const isAlreadySelected = selectedImages.find(img => img.id === image.id)
    
    if (isAlreadySelected) {
      setSelectedImages(selectedImages.filter(img => img.id !== image.id))
    } else {
      if (selectedImages.length >= 5) {
        toast({ title: "Limit Reached", description: "You can select up to 5 hero images.", variant: "destructive" })
        return
      }
      setSelectedImages([...selectedImages, { 
        id: image.id, 
        url: image.url, 
        prompt: image.prompt,
        label: '' 
      }])
    }
  }
  
  const handleUpdateLabel = (imageId: string, label: string) => {
    setSelectedImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, label } : img
    ))
  }

  const handleRemoveSelected = (imageId: string) => {
    setSelectedImages(prev => prev.filter(img => img.id !== imageId))
  }
  
  const handleApprove = async () => {
    if (selectedImages.length === 0) {
      toast({ title: "Selection Required", description: "Please select at least one hero image.", variant: "destructive" })
      return
    }
    
    // Check if multiple selected images have labels
    if (selectedImages.length > 1) {
      const unlabeled = selectedImages.filter(img => !img.label?.trim())
      if (unlabeled.length > 0) {
        setShowLabelPanel(true)
        toast({ title: "Labels Required", description: "Please add labels to help AI identify each image's purpose.", variant: "destructive" })
        return
      }
    }
    
    await selectImages(selectedImages.map(img => ({ imageId: img.id, label: img.label })))
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Prompt Required", description: "Please enter a prompt to generate images.", variant: "destructive" })
      return
    }
    await generate(prompt)
    setPrompt('')
    setEditMode(false)
    setEditingImage(null)
  }

  const handleCopyPrompt = (imagePrompt: string) => {
    navigator.clipboard.writeText(imagePrompt)
    toast({ title: "Prompt copied", description: "Prompt copied to clipboard." })
  }

  const handleReusePrompt = (imagePrompt: string) => {
    setPrompt(imagePrompt)
    toast({ title: "Prompt loaded", description: "Prompt added to the input box." })
  }

  const handleEditImage = (image: StudioHeroImage) => {
    setEditingImage(image)
    setPrompt(image.prompt)
    setEditMode(true)
  }

  const handleCancelEdit = () => {
    setEditMode(false)
    setEditingImage(null)
    setPrompt('')
  }

  if (isGenerating && heroImages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-12">
        <Loader2 className="w-12 h-12 animate-spin text-purple-500 mb-4" />
        <h3 className="text-xl font-semibold">Generating Hero Images...</h3>
        <p className="text-muted-foreground mt-2">AI is creating visual references for your video</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <StepHeader
        title="Hero Asset Generator"
        subtitle="Create visual references for your video"
      />
      
      <div className="flex-1 overflow-y-auto p-6 bg-white/40 dark:bg-black/20 transition-colors">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {/* Prompt Input Section */}
          <GlassCard className="p-6">
            <div className="space-y-4">
              <label className="text-sm font-semibold text-foreground">
                {editMode ? 'Edit Prompt' : 'Generate New Hero Image'}
              </label>
              
              <Textarea
                placeholder="Describe your ideal hero image... (e.g., 'Product floating in clouds with golden sunlight, cinematic lighting, ultra detailed')"
                className="min-h-[100px] resize-none bg-white/80 dark:bg-black/40 text-base"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              
              {/* Reference Image Preview (Edit Mode) */}
              {editMode && editingImage && (
                <div className="flex items-center gap-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className={cn(
                    "w-16 h-16 rounded-lg bg-gradient-to-br flex-shrink-0 flex items-center justify-center overflow-hidden",
                    getGradientFromId(editingImage.id)
                  )}>
                    {editingImage.url ? (
                      <img src={editingImage.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-white/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">Editing based on:</p>
                    <p className="text-sm font-medium truncate">{editingImage.prompt}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                    Cancel Edit
                  </Button>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Button variant="outline" className="gap-2" onClick={() => toast({ title: "Coming soon" })}>
                  <Upload className="w-4 h-4" />
                  Add Reference Image
                </Button>
                
                <div className="flex-1" />
                
                {editMode && (
                  <Button variant="outline" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
                
                <GradientButton onClick={handleGenerate} disabled={!prompt.trim() || isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      {editMode ? 'Generate Variation' : 'Generate'}
                    </>
                  )}
                </GradientButton>
              </div>
            </div>
          </GlassCard>

          {/* Selected Images with Labels Panel */}
          {selectedImages.length > 0 && (
            <GlassCard className={cn(
              "p-5 transition-all",
              showLabelPanel && "border-2 border-purple-500/50 bg-purple-500/5"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-purple-500" />
                  <h3 className="text-sm font-semibold">
                    Selected Images ({selectedImages.length})
                    {selectedImages.length > 1 && (
                      <span className="text-muted-foreground font-normal ml-2">
                        — Add labels to help AI use them in storyboard
                      </span>
                    )}
                  </h3>
                </div>
                {showLabelPanel && (
                  <Button variant="ghost" size="sm" onClick={() => setShowLabelPanel(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {selectedImages.map((image, idx) => (
                  <div 
                    key={image.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-white/50 dark:bg-black/30 border border-black/5 dark:border-white/10"
                  >
                    {/* Thumbnail */}
                    <div className={cn(
                      "w-14 h-14 rounded-lg bg-gradient-to-br flex-shrink-0 flex items-center justify-center overflow-hidden",
                      getGradientFromId(image.id)
                    )}>
                      {image.url ? (
                        <img src={image.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-white/50" />
                      )}
                    </div>
                    
                    {/* Label Input */}
                    <div className="flex-1 min-w-0">
                      <Input
                        placeholder={`Label for image ${idx + 1} (e.g., "Main product shot", "Background scene")`}
                        value={image.label || ''}
                        onChange={(e) => handleUpdateLabel(image.id, e.target.value)}
                        className="bg-white/80 dark:bg-black/40"
                      />
                      <p className="text-xs text-muted-foreground mt-1 truncate">{image.prompt}</p>
                    </div>
                    
                    {/* Remove Button */}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="flex-shrink-0 hover:text-red-500 hover:bg-red-500/10"
                      onClick={() => handleRemoveSelected(image.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
              
              {selectedImages.length > 1 && (
                <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Labels help AI decide which image(s) to use for each storyboard frame
                </p>
              )}
            </GlassCard>
          )}

          {/* Generated Images Grid */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              Generated Images ({heroImages.length})
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {heroImages.map((image) => {
                const isSelected = !!selectedImages.find(img => img.id === image.id)
                
                return (
                  <GlassCard
                    key={image.id}
                    className={cn(
                      "cursor-pointer transition-all group relative overflow-hidden",
                      isSelected ? "ring-2 ring-purple-500 bg-purple-500/5 scale-[1.02]" : "hover:ring-1 hover:ring-purple-500/30"
                    )}
                    onClick={() => handleSelect(image)}
                  >
                    {/* Image */}
                    <div className={cn(
                      "aspect-square bg-gradient-to-br flex items-center justify-center relative overflow-hidden",
                      getGradientFromId(image.id)
                    )}>
                      {image.url ? (
                        <img src={image.url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-16 h-16 text-white/30 group-hover:scale-110 transition-transform duration-500" />
                      )}
                      
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-purple-500 shadow-lg flex items-center justify-center animate-in zoom-in">
                          <Check className="w-5 h-5 text-white" />
                        </div>
                      )}
                      
                      {/* Hover Overlay with Prompt & Actions */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                        {/* Prompt Text */}
                        <p className="text-white text-sm mb-4 line-clamp-3 leading-relaxed">
                          {image.prompt}
                        </p>
                        
                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-white hover:bg-white/20 gap-1.5 flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyPrompt(image.prompt)
                            }}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-white hover:bg-white/20 gap-1.5 flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleReusePrompt(image.prompt)
                            }}
                          >
                            <ArrowRight className="w-3.5 h-3.5" />
                            Reuse
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="text-white hover:bg-white/20 gap-1.5 flex-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditImage(image)
                            }}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-white hover:bg-white/20 flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              toast({ title: "Downloading..." })
                            }}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Card Footer */}
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-purple-500">{image.type}</span>
                        {isSelected && (
                          <span className="text-xs text-purple-500 font-medium">Selected</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{image.prompt}</p>
                    </div>
                  </GlassCard>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="border-t border-black/5 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-sm p-4 transition-colors">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {selectedImages.length > 0 ? (
              <span>
                {selectedImages.length} image{selectedImages.length > 1 ? 's' : ''} selected
                {selectedImages.length > 1 && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-purple-500 px-2"
                    onClick={() => setShowLabelPanel(true)}
                  >
                    Edit labels
                  </Button>
                )}
              </span>
            ) : (
              <span>Click images to select them as references</span>
            )}
          </div>
          
          <GradientButton
            onClick={handleApprove}
            disabled={selectedImages.length === 0 || isGenerating}
          >
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </GradientButton>
        </div>
      </div>
    </div>
  )
}
