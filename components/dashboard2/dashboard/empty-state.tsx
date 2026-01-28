'use client'

import { Inbox } from 'lucide-react'
import { GradientButton } from '../ui/gradient-button'

interface EmptyStateProps {
  onCreateNew: () => void
}

export function EmptyState({ onCreateNew }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
        <Inbox className="w-12 h-12 text-purple-400" />
      </div>
      
      <h3 className="text-2xl font-bold mb-2">No projects yet</h3>
      <p className="text-muted-foreground mb-8 text-center max-w-md">
        Start your creative journey by creating your first AI-powered video ad project
      </p>
      
      <GradientButton onClick={onCreateNew} size="lg">
        Create Your First Project
      </GradientButton>
    </div>
  )
}
