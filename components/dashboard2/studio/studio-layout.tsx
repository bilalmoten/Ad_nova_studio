import { ReactNode } from 'react'
import { AnimatedBackground } from '../animated-background'
import { DashboardNav } from '../layout/dashboard-nav'
import { StudioSidebar } from './studio-sidebar'

interface StudioLayoutProps {
  children: ReactNode
}

export function StudioLayout({ children }: StudioLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AnimatedBackground />
      <DashboardNav />
      
      <div className="flex-1 flex">
        <StudioSidebar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
