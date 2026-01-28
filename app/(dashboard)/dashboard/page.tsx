'use client'

import { useState, useEffect } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard2/layout/dashboard-layout'
import { ProjectGrid } from '@/components/dashboard2/dashboard/project-grid'
import { EmptyState } from '@/components/dashboard2/dashboard/empty-state'
import { CreateProjectModal } from '@/components/dashboard2/dashboard/create-project-modal'
import { GradientButton } from '@/components/dashboard2/ui/gradient-button'
import { getV2Projects } from '@/server/actions/studio/v2-projects'
import type { V2Project } from '@/lib/studio/v2-types'

export default function Dashboard2Page() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [projects, setProjects] = useState<V2Project[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const loadProjects = async () => {
    setIsLoading(true)
    const result = await getV2Projects()
    
    if (result.error) {
      setError(result.error)
    } else {
      setProjects(result.data || [])
    }
    setIsLoading(false)
  }
  
  useEffect(() => {
    loadProjects()
  }, [])
  
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-purple-500 mx-auto mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading projects...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }
  
  if (error) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading projects</p>
            <p className="text-muted-foreground text-sm">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }
  
  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            Your Projects
          </h1>
          <p className="text-muted-foreground">
            Create, manage, and export your AI-powered video ad campaigns
          </p>
        </div>
        
        {projects.length > 0 && (
          <GradientButton
            onClick={() => setShowCreateModal(true)}
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            New Project
          </GradientButton>
        )}
      </div>
      
      {/* Content */}
      {projects.length === 0 ? (
        <EmptyState onCreateNew={() => setShowCreateModal(true)} />
      ) : (
        <ProjectGrid projects={projects} onProjectDeleted={loadProjects} />
      )}
      
      {/* Create Modal */}
      <CreateProjectModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onProjectCreated={loadProjects}
      />
    </DashboardLayout>
  )
}
