'use client'

import { V2Project } from '@/lib/studio/v2-types'
import { ProjectCard } from './project-card'

interface ProjectGridProps {
  projects: V2Project[]
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
