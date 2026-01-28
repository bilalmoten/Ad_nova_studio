import { Reorder, useDragControls } from 'framer-motion'
import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SortableItemProps {
  value: any
  children: ReactNode
  className?: string
  as?: any
}

export function SortableItem({ value, children, className, as }: SortableItemProps) {
  const controls = useDragControls()
  const Component = as || 'div'

  return (
    <Reorder.Item value={value} dragListener={false} dragControls={controls} as="div">
      <div className={cn("relative touch-none", className)}>
        {/* Drag Handle passed to children via context or prop if needed, 
            but for simplicity we assume children will include a drag handle triggering `controls` 
            Actually Reorder.Item expects the handle to catch the event. 
            Let's wrap children to expose controls.
         */}
        {children}
      </div>
    </Reorder.Item>
  )
}

// Helper to export controls usage if needed, but Reorder.Item handles it if we pass dragControls
// For custom handles:
export { useDragControls }
