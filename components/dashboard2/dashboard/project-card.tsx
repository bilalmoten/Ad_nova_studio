'use client'

import { StudioProject } from '@/lib/studio/types'
import { GlassCard } from '../ui/glass-card'
import { Clock, Film, Trash2 } from 'lucide-react'
import { formatDate, getGradientFromId } from '@/lib/dashboard2/utils'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { deleteStudioProject } from '@/server/actions/studio/projects'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'

interface ProjectCardProps {
  project: StudioProject
  index: number
  onDeleted?: () => void
}

export function ProjectCard({ project, index, onDeleted }: ProjectCardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isDeleting, setIsDeleting] = useState(false)
  
  const statusConfig = {
    draft: { label: 'Draft', color: 'text-gray-400' },
    'in-progress': { label: 'In Progress', color: 'text-pink-400' },
    completed: { label: 'Completed', color: 'text-purple-400' },
  }
  
  const handleClick = () => {
    router.push(`/dashboard2/studio/${project.id}`)
  }
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project?')) return
    
    setIsDeleting(true)
    const result = await deleteStudioProject(project.id)
    
    if (result.error) {
      toast({ title: 'Error', description: result.error, variant: 'destructive' })
    } else {
      toast({ title: 'Project deleted' })
      onDeleted?.()
    }
    setIsDeleting(false)
  }
  
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
            <span className={cn('text-xs font-medium', statusConfig[project.status].color)}>
              {statusConfig[project.status].label}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
            {project.prompt || project.description || 'No description'}
          </p>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDate(new Date(project.updated_at))}</span>
            </div>
            <div className="flex items-center gap-2">
              <span>{project.shot_count} shots</span>
              <span>•</span>
              <span>{project.aspect_ratio}</span>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  )
}
