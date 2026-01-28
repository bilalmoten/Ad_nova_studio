import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard | AdNova Studio',
  description: 'AI-powered video ad creation studio',
}

export default function Dashboard2Layout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
