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