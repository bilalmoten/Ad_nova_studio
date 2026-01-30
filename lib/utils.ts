import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGradientFromId(id: string) {
  const gradients = [
    "bg-gradient-to-br from-pink-500/20 to-rose-500/20",
    "bg-gradient-to-br from-indigo-500/20 to-purple-500/20",
    "bg-gradient-to-br from-blue-500/20 to-cyan-500/20",
    "bg-gradient-to-br from-emerald-500/20 to-lime-500/20",
    "bg-gradient-to-br from-amber-500/20 to-orange-500/20",
  ]
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length
  return gradients[index]
}

/**
 * Format a date as relative time (e.g., "2m ago", "1h ago", "3d ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()

  const seconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (weeks < 4) return `${weeks}w ago`
  return `${months}mo ago`
}