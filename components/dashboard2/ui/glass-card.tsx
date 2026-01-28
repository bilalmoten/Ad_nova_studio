import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  hover?: boolean
  onClick?: () => void
}

export function GlassCard({ children, className, hover = false, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border backdrop-blur-md transition-all duration-300',
        'border-white/10 bg-white/5 dark:border-white/10 dark:bg-white/5', // Dark mode defaults
        'light:border-black/5 light:bg-white/60 light:shadow-sm', // Light mode specifics (using Tailwind's light: or just default/dark:)
        // Actually, Tailwind usually uses `dark:` for dark mode and base classes for light mode.
        'bg-white/40 border-black/5 shadow-sm dark:bg-white/5 dark:border-white/10 dark:shadow-none',
        
        hover && 'hover:bg-white/60 hover:border-black/10 hover:shadow-md dark:hover:bg-white/8 dark:hover:border-white/20 dark:hover:shadow-purple-500/10 hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  )
}
