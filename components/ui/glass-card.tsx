import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'dark'
}

export function GlassCard({ children, className, variant = 'default', ...props }: GlassCardProps) {
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-xl border backdrop-blur-md",
        variant === 'default' 
          ? "bg-zinc-900/40 border-zinc-800/50" 
          : "bg-black/40 border-zinc-800/30",
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}
