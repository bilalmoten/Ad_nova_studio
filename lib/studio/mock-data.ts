// lib/studio/mock-data.ts

export type MockAsset = {
    id: string
    type: 'image' | 'video' | 'script'
    url?: string
    content?: string // For scripts
    prompt?: string
    status: 'processing' | 'ready' | 'failed'
    isFavorite: boolean
    isTemporary: boolean
    createdAt: string
    meta?: any
    parentId?: string
}

export const MOCK_ASSETS: MockAsset[] = [
    // 1. Script
    {
        id: 'script-1',
        type: 'script',
        content: `SCENE 1:
EXT. CYBERPUNK TOKYO - NIGHT
Neon rain falls on wet pavement. A hooded figure stands watching a hologram advertisement.

SCENE 2:
INT. DOJO - DAY
Sunlight streams through shoji screens. Dust motes dance in the air.`,
        prompt: 'Cyberpunk Tokyo Ad Script',
        status: 'ready',
        isFavorite: true,
        isTemporary: false,
        createdAt: new Date().toISOString(),
    },
    // 2. Images (Cinematic)
    {
        id: 'img-1',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1635321359679-6f176e73715c?q=80&w=2938&auto=format&fit=crop', // Cyberpunk neon
        prompt: 'Cyberpunk street scene, 8k resolution, neon lighting, wet pavement, cinematic composition, Arri Alexa',
        status: 'ready',
        isFavorite: true,
        isTemporary: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        meta: { width: 1920, height: 1080 }
    },
    {
        id: 'img-2',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2940&auto=format&fit=crop', // Futuristic architecture
        prompt: 'Wide shot of futuristic white architecture, clean lines, utopia, soft daylight, 8k',
        status: 'ready',
        isFavorite: false,
        isTemporary: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
        meta: { width: 1920, height: 1080 },
        parentId: 'img-1' // MOCK LINEAGE
    },
    {
        id: 'img-3',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1542259680-77a82772e2cf?q=80&w=2940&auto=format&fit=crop', // Portrait
        prompt: 'Close up portrait of an old man with detailed wrinkles, cinematic lighting, rembrandt style, 85mm lens',
        status: 'ready',
        isFavorite: false,
        isTemporary: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        meta: { width: 1080, height: 1920 } // Portrait
    },
    {
        id: 'img-4',
        type: 'image',
        url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2940&auto=format&fit=crop', // Tech
        prompt: 'Macro shot of a futuristic circuit board, glowing blue lines, depth of field, tech ad',
        status: 'ready',
        isFavorite: false,
        isTemporary: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        meta: { width: 1920, height: 1080 }
    },
    // 3. Video
    {
        id: 'vid-1',
        type: 'video',
        url: '', // Video placeholder 
        prompt: 'Slow motion rain falling on neon sign, cinematic pan right',
        status: 'processing',
        isFavorite: false,
        isTemporary: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        meta: { duration: 4.5 }
    }
]
