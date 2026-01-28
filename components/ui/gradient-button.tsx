import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface GradientButtonProps extends React.ComponentProps<typeof Button> {
  gradient?: 'purple' | 'green' | 'blue'
}

export function GradientButton({ children, className, gradient = 'purple', ...props }: GradientButtonProps) {
  const gradients = {
    purple: "bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-[#c084fc]/20",
    green: "bg-gradient-to-r from-emerald-500 to-lime-500 hover:from-emerald-600 hover:to-lime-600 text-black shadow-[#a3e635]/20",
    blue: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-cyan-500/20",
  }

  return (
    <Button 
      className={cn(
        "border-0 shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]",
        gradients[gradient],
        className
      )} 
      {...props}
    >
      {children}
    </Button>
  )
}
