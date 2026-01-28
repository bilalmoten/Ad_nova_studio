// Dashboard2 Utility Functions

/**
 * Simulates AI processing with realistic delays
 */
export async function simulateAI<T>(data: T): Promise<T> {
    // Return immediately or with a tiny tick to allow UI updates, but effectively instant as requested
    return new Promise((resolve) => {
        setTimeout(() => resolve(data), 100)
    })
}

/**
 * Deterministically generate a gradient class from an ID
 * All gradients use brand purple/pink/magenta palette for consistency
 */
export function getGradientFromId(id: string): string {
    const gradients = [
        'from-purple-500 to-purple-600',
        'from-pink-500 to-pink-600',
        'from-purple-500 via-pink-500 to-purple-600',
        'from-fuchsia-500 to-purple-600',
        'from-purple-600 to-pink-500',
        'from-violet-500 to-fuchsia-600',
    ]
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return gradients[hash % gradients.length]
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Formats duration in seconds to MM:SS
 */
export function formatDuration(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Gets icon name based on type
 */
export function getIconForType(type: string): string {
    const iconMap: Record<string, string> = {
        concept: 'sparkles',
        shot: 'film',
        frame: 'image',
        video: 'play',
        product: 'package',
        model: 'user',
        style: 'palette',
        environment: 'map',
    }
    return iconMap[type] || 'circle'
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, length: number): string {
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
}
