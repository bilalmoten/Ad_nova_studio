'use client'

import { V2Project } from '@/lib/studio/v2-types'
import { GlassCard } from '../ui/glass-card'
import { Clock, Film, Trash2 } from 'lucide-react'
import { formatDate, getGradientFromId } from '@/lib/dashboard2/utils'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { deleteV2Project } from '@/server/actions/studio/v2-projects'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface ProjectCardProps {
  project: V2Project
  index: number
  onDeleted?: () => void
}

export function ProjectCard({ project, index, onDeleted }: ProjectCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  
  const handleClick = () => {
    router.push(`/dashboard/studio/${project.id}`)
  }
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project?')) return
    
    setIsDeleting(true)
    const result = await deleteV2Project(project.id)
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Project deleted' })
      onDeleted?.()
    }
    setIsDeleting(false)
  }
  
  const shotCount = project.settings?.shot_count || 5
  const aspectRatio = project.settings?.aspect_ratio || '16:9'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard hover className="cursor-pointer group relative" onClick={handleClick}>
        {/* Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 hover:bg-red-500 text-white"
          onClick={handleDelete}
          disabled={isDeleting}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        
        {/* Thumbnail */}
        <div className={cn(
          'aspect-video rounded-t-xl bg-gradient-to-br flex items-center justify-center',
          getGradientFromId(project.id)
        )}>
          <Film className="w-12 h-12 text-white/50" />
        </div>
        
        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg line-clamp-1">{project.name}</h3>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">
            {project.description || 'No description provided'}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(new Date(project.updated_at))}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{shotCount} shots</span>
              <span>•</span>
              <span>{aspectRatio}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
