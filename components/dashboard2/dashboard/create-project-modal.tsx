'use client'

import { useState, useRef, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { GradientButton } from '../ui/gradient-button'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
// import { createStudioProject } from '@/server/actions/studio/projects'
import { uploadTempImage } from '@/server/actions/studio/v2-upload'

interface CreateProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onProjectCreated?: () => void
}

interface UploadedFile {
  file: File
  preview: string
}

export function CreateProjectModal({ open, onOpenChange, onProjectCreated }: CreateProjectModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [formData, setFormData] = useState({
    name: '',
    prompt: '',
    visualStyle: '',
    userNotes: '',
    shotCount: 5,
    aspectRatio: '16:9',
  })
  
  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return
    
    const imageFiles = Array.from(files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (imageFiles.length === 0) {
      toast({ title: 'Invalid file type', description: 'Please upload image files only', variant: 'destructive' })
      return
    }
    
    // Only allow one reference image for now
    const file = imageFiles[0]
    const preview = URL.createObjectURL(file)
    
    // Clean up previous preview URL
    uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview))
    
    setUploadedFiles([{ file, preview }])
  }, [toast, uploadedFiles])
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])
  
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [handleFiles])
  
  const removeFile = useCallback((index: number) => {
    const file = uploadedFiles[index]
    if (file) {
      URL.revokeObjectURL(file.preview)
    }
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
  }, [uploadedFiles])
  
  const handleSubmit = async () => {
    if (!formData.prompt.trim()) {
      toast({ title: 'Description required', description: 'Please describe the video you want to create', variant: 'destructive' })
      return
    }

    setIsCreating(true)
    
    let referenceImageUrl: string | undefined
    
    // Upload reference image if provided
    if (uploadedFiles.length > 0) {
      try {
        // const file = uploadedFiles[0].file
        // const reader = new FileReader()
        // const base64 = await new Promise<string>((resolve) => {
        //   reader.onload = () => {
        //     const result = reader.result as string
        //     // Remove data URL prefix
        //     resolve(result.split(',')[1])
        //   }
        //   reader.readAsDataURL(file)
        // })
        
        // Create a temporary project ID for upload
        const formData = new FormData()
        formData.append('file', uploadedFiles[0].file)
        
        const uploadResult = await uploadTempImage(formData)
        if (uploadResult.error) {
          throw new Error(uploadResult.error)
        }
        referenceImageUrl = uploadResult.url
      } catch (error) {
        console.error('Failed to upload reference image:', error)
        toast({ title: 'Upload failed', description: 'Could not upload reference image', variant: 'destructive' })
      }
    }
    
    // Map inputs to V2 Project structure
    const projectInputs = {
      name: formData.name || 'Untitled Project',
      description: formData.prompt,
      settings: {
        shot_count: formData.shotCount,
        aspect_ratio: formData.aspectRatio as '16:9' | '9:16' | '1:1' | '4:3',
        visual_style: formData.visualStyle,
        user_notes: formData.userNotes,
        reference_image_url: referenceImageUrl,
        initial_prompt: formData.prompt,
      },
      // Create initial anchors from inputs
      anchors: [
         ...(formData.visualStyle ? [{
             id: crypto.randomUUID(),
             type: 'style' as const,
             label: 'Visual Style',
             value: formData.visualStyle,
             is_active: true
         }] : [])
      ]
    }

    // Call V2 Action
    // We import createV2Project dynamically or change import at top
    const { createV2Project } = await import('@/server/actions/studio/v2-projects')
    const result = await createV2Project(projectInputs)
    
    if (result.error) {
      toast({ title: 'Error creating project', description: result.error, variant: 'destructive' })
      setIsCreating(false)
      return
    }
    
    toast({ title: 'Project created', description: 'Taking you to the studio...' })
    onOpenChange(false)
    onProjectCreated?.()
    
    // Cleanup
    uploadedFiles.forEach(f => URL.revokeObjectURL(f.preview))
    setUploadedFiles([])
    
    // Navigate to studio (V2 route)
    if (result.data) {
      router.push(`/dashboard/studio/${result.data.id}`)
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create New Project</DialogTitle>
          <p className="text-muted-foreground">
            Define your video vision and let AI bring it to life
          </p>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          {/* Left Column - Project Details */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                placeholder="e.g., Product Launch 2025"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="prompt">Project Brief *</Label>
              <Textarea
                id="prompt"
                placeholder="Describe the video you want to create... (e.g., 'A sleek product reveal for our new smartphone...')"
                className="min-h-[120px]"
                value={formData.prompt}
                onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="visualStyle">Visual Style</Label>
              <Input
                id="visualStyle"
                placeholder="e.g., Cinematic, Minimalist, Bold"
                value={formData.visualStyle}
                onChange={(e) => setFormData({ ...formData, visualStyle: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userNotes">Additional Notes</Label>
              <Textarea
                id="userNotes"
                placeholder="Any specific requirements or preferences..."
                className="min-h-[80px]"
                value={formData.userNotes}
                onChange={(e) => setFormData({ ...formData, userNotes: e.target.value })}
              />
            </div>
          </div>
          
          {/* Right Column - Technical Specs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="shotCount">Number of Shots</Label>
              <Input
                id="shotCount"
                type="number"
                min="3"
                max="12"
                value={formData.shotCount}
                onChange={(e) => setFormData({ ...formData, shotCount: parseInt(e.target.value) || 5 })}
              />
              <p className="text-xs text-muted-foreground">Recommended: 5-8 shots for a 30-second video</p>
            </div>
            
            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <div className="grid grid-cols-4 gap-2">
                {(['16:9', '9:16', '1:1', '4:5']).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setFormData({ ...formData, aspectRatio: ratio })}
                    className={`px-3 py-2 rounded-md border transition-all ${
                      formData.aspectRatio === ratio
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-input hover:border-purple-300'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Reference Image (Optional)</Label>
              
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInputChange}
                className="hidden"
              />
              
              {uploadedFiles.length === 0 ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    isDragging 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-input hover:border-purple-400'
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Drag and drop reference images</p>
                  <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
                </div>
              ) : (
                <div className="relative group">
                  <img 
                    src={uploadedFiles[0].preview} 
                    alt="Reference" 
                    className="w-full h-40 object-cover rounded-lg border border-input"
                  />
                  <button
                    type="button"
                    onClick={() => removeFile(0)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 rounded bg-black/70 text-xs">
                    <ImageIcon className="w-3 h-3" />
                    {uploadedFiles[0].file.name}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-white/10">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            Cancel
          </Button>
          <GradientButton
            onClick={handleSubmit}
            disabled={!formData.prompt.trim() || isCreating}
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              'Create Project'
            )}
          </GradientButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}
