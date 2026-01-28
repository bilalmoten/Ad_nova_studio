'use client'

import { StudioProject } from '@/lib/studio/types'
import { ProjectCard } from './project-card'

interface ProjectGridProps {
  projects: StudioProject[]
  onProjectDeleted?: () => void
}

export function ProjectGrid({ projects, onProjectDeleted }: ProjectGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project, index) => (
        <ProjectCard 
          key={project.id} 
          project={project} 
          index={index} 
          onDeleted={onProjectDeleted}
        />
      ))}
    </div>
  )
}
