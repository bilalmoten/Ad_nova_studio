import { Sparkles } from 'lucide-react'
import { ReactNode } from 'react'

interface StepHeaderProps {
  title: string
  subtitle?: string
  rightActions?: ReactNode
  showAIBadge?: boolean
}

export function StepHeader({ title, subtitle, rightActions, showAIBadge = true }: StepHeaderProps) {
  return (
    <div className="border-b border-white/10 bg-white/5 backdrop-blur-sm px-8 py-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{title}</h1>
            {showAIBadge && (
              <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                AI Generated
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground">{subtitle}</p>
          )}
        </div>
        
        {rightActions && (
          <div className="flex items-center gap-2">
            {rightActions}
          </div>
        )}
      </div>
    </div>
  )
}
