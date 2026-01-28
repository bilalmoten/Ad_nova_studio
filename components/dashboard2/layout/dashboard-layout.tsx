import { ReactNode } from 'react'
import { AnimatedBackground } from '../animated-background'
import { DashboardNav } from './dashboard-nav'

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <AnimatedBackground />
      <DashboardNav />
      <main className="container mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
