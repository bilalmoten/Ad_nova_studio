// lib/studio/prompts.ts
// ============================================
// Centralized AI Prompts for Studio
// Optimized for temporal coherence and visual consistency
// across multiple AI-generated shots
// ============================================

// =====================
// MODEL CONFIGURATION
// Note: Keep in sync with lib/ai/studio-client.ts
// =====================
export const MODELS = {
    text: 'gemini-3-pro-preview',
    image: 'gemini-3-pro-image-preview',
    video: 'veo-3.1-fast-generate-preview',
} as const

// =====================
// GENERATION SETTINGS
// =====================
export const GENERATION_SETTINGS = {
    concepts: {
        model: MODELS.text,
        count: 3,
        temperature: 0.8,
    },
    storyline: {
        model: MODELS.text,
        temperature: 0.7,
    },
    heroImages: {
        model: MODELS.image,
        imagesPerBatch: 3,
    },
    storyboard: {
        model: MODELS.text, // For determining image assignments
        frameModel: MODELS.image, // For generating actual frames
        temperature: 0.6,
    },
    motionPrompts: {
        model: MODELS.text,
        temperature: 0.7,
    },
    video: {
        model: MODELS.video,
        defaultDuration: 6,
        resolution: '720p' as const,
        creditsPerShot: 10,
    },
} as const

// =====================
// CONCEPT GENERATION
// Enhanced with Technical Profile for visual consistency
// =====================
export const CONCEPT_PROMPTS = {
    system: `You are a Technical Director for high-end TV commercials and video advertisements.
Your goal is to define a visual style that remains CONSISTENT across multiple AI-generated shots.
You must define specific camera gear, lighting setups, and color grades that can be replicated exactly.

For every concept, you MUST specify a detailed technical_profile string containing:
- Camera model and lens (e.g., "Arri Alexa Mini LF, 35mm anamorphic lens, slight vignette")
- Film stock or digital grade (e.g., "Kodak Vision3 500T emulation, teal/orange color grade")
- Lighting style (e.g., "Soft tungsten key light at 45 degrees, subtle rim light, volumetric haze")
- Texture and grain (e.g., "Fine film grain, medium contrast, lifted blacks")

This technical profile is the "glue" that holds all shots together visually.`,

    generate: (params: {
        prompt: string
        visualStyle?: string
        userNotes?: string
        hasReferenceImages: boolean
    }) => `Based on this advertising brief:

${params.prompt}

${params.visualStyle ? `Visual Style Preference: ${params.visualStyle}` : ''}
${params.userNotes ? `Additional Context: ${params.userNotes}` : ''}
${params.hasReferenceImages ? `Note: The user has provided reference images. Incorporate their visual elements into your concepts and technical specifications.` : ''}

Generate ${GENERATION_SETTINGS.concepts.count} unique, compelling video ad concepts.

For each concept, provide:
- name: A catchy, memorable name for the concept
- tagline: A short punchy tagline (max 10 words)
- description: 2-3 sentences describing the visual narrative
- visualStyle: The overall aesthetic (e.g., "Cinematic noir", "Bright and energetic")
- technicalProfile: CRITICAL - A detailed string specifying exact camera, lens, lighting, color grade, and texture that will be used for EVERY shot (e.g., "Arri Alexa Mini, 50mm Zeiss Master Prime, soft diffused daylight, Kodak Portra 400 film emulation, warm highlights, crushed blacks, fine grain")
- colorPalette: 3-4 key colors that define the look (as hex or descriptive)
- pacing: The rhythm and speed (e.g., "Fast-paced with quick cuts", "Slow and contemplative")
- keyMoments: 3 must-have visual moments
- cameraWork: Suggested camera techniques

IMPORTANT: The technicalProfile must be specific enough that every shot generated with it will look like it belongs in the same production.`,

    schema: {
        type: 'object',
        properties: {
            concepts: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                        tagline: { type: 'string' },
                        description: { type: 'string' },
                        visualStyle: { type: 'string' },
                        technicalProfile: { type: 'string' },
                        colorPalette: { type: 'array', items: { type: 'string' } },
                        pacing: { type: 'string' },
                        keyMoments: { type: 'array', items: { type: 'string' } },
                        cameraWork: { type: 'string' },
                    },
                    required: ['name', 'tagline', 'description', 'visualStyle', 'technicalProfile', 'pacing'],
                },
            },
        },
        required: ['concepts'],
    },
}

// =====================
// STORYLINE GENERATION
// Enhanced with subject anchoring for character/product consistency
// =====================
export const STORYLINE_PROMPTS = {
    system: `You are a video storyboard artist and director.
You break down concepts into clear, actionable shots that can be generated by AI.
Each shot should have a clear visual description and purpose.

CRITICAL for AI consistency:
- If a character or product appears multiple times, describe them IDENTICALLY each time
- Include specific details like clothing, colors, and positioning
- Maintain consistent environment descriptions across related shots`,

    generate: (params: {
        concept: {
            name: string
            tagline: string
            description: string
            visualStyle: string
            pacing: string
            technicalProfile?: string
        }
        shotCount: number
        userInstructions?: string
        hasReferenceImages: boolean
    }) => `Create a ${params.shotCount}-shot storyline for this video concept:

Concept: ${params.concept.name}
Tagline: "${params.concept.tagline}"
Description: ${params.concept.description}
Visual Style: ${params.concept.visualStyle}
Pacing: ${params.concept.pacing}
${params.concept.technicalProfile ? `Technical Look: ${params.concept.technicalProfile}` : ''}

${params.userInstructions ? `User Instructions: ${params.userInstructions}` : ''}
${params.hasReferenceImages ? `Note: Reference images are available. Describe how they should be incorporated into specific shots.` : ''}

For each shot, provide:
- title: Short descriptive title (e.g., "Hero Product Reveal")
- description: Detailed visual description of what we see. Be SPECIFIC about:
  * Subject appearance (if character/product, describe exactly)
  * Environment details (lighting, location, atmosphere)
  * Camera position and framing
- voiceoverAction: What narration or action happens (optional)
- duration: Suggested duration in seconds (4-8)

IMPORTANT: If a subject (person, product, object) appears in multiple shots, use the EXACT SAME description each time to ensure AI consistency.

Ensure shots flow naturally and tell a cohesive story with consistent visual language.`,

    schema: {
        type: 'object',
        properties: {
            shots: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        title: { type: 'string' },
                        description: { type: 'string' },
                        voiceoverAction: { type: 'string' },
                        duration: { type: 'number' },
                    },
                    required: ['title', 'description'],
                },
            },
        },
        required: ['shots'],
    },
}

// =====================
// HERO IMAGE GENERATION
// Enhanced with storyline context and reference awareness
// =====================
export const HERO_IMAGE_PROMPTS = {
    generateFromConcept: (params: {
        concept: {
            name: string
            description: string
            visualStyle: string
            colorPalette?: string | string[]
            technicalProfile?: string
        }
        storylineSummary?: string
        hasProductReferences: boolean
        hasCharacterReferences: boolean
    }) => {
        // Handle colorPalette as either string or array (DB stores as TEXT)
        const colorPaletteStr = params.concept.colorPalette
            ? (Array.isArray(params.concept.colorPalette)
                ? params.concept.colorPalette.join(', ')
                : params.concept.colorPalette)
            : ''

        return `[TECHNICAL SPECIFICATIONS]
${params.concept.technicalProfile || 'Professional cinematic lighting, shallow depth of field, 8K quality'}

[CREATIVE DIRECTION]
Title: ${params.concept.name}
Description: ${params.concept.description}
Visual Style: ${params.concept.visualStyle}
${colorPaletteStr ? `Color Palette: ${colorPaletteStr}` : ''}

${params.storylineSummary ? `[STORY CONTEXT]\nThis hero image should establish the visual world for this story:\n${params.storylineSummary}` : ''}

${params.hasProductReferences ? '[PRODUCT REFERENCE]\nIMPORTANT: Use the provided product reference image for EXACT product appearance, colors, and details. The product must match the reference precisely.' : ''}
${params.hasCharacterReferences ? '[CHARACTER REFERENCE]\nIMPORTANT: Use the provided character reference image for consistent character appearance, clothing, and features.' : ''}

[REQUIREMENTS]
- Professional commercial quality matching technical specifications EXACTLY
- Consistent with the visual story that will unfold
- Clean, impactful composition suitable as key art
- High detail and visual fidelity
- The image should work as a reference for all subsequent shots`
    },

    enhance: (basePrompt: string, technicalProfile?: string) =>
        `${technicalProfile ? `[TECHNICAL SPECIFICATIONS]\n${technicalProfile}\n\n` : ''}${basePrompt}

Technical requirements:
- 8K ultra high resolution quality
- Professional studio lighting matching specifications
- Rich, vibrant colors consistent with the look
- Sharp focus on key elements`,
}

// =====================
// STORYBOARD IMAGE ASSIGNMENTS
// =====================
export const STORYBOARD_ASSIGNMENT_PROMPTS = {
    system: `You are a storyboard coordinator. 
You determine which reference images should be used for each shot based on their labels and the shot requirements.
You also create detailed prompts for generating storyboard frames.

Ensure visual consistency by:
- Using product/character hero images whenever those elements appear
- Maintaining consistent environment descriptions
- Matching lighting and color to the technical profile`,

    generate: (params: {
        shots: Array<{
            orderIndex: number
            title: string
            description: string
        }>
        heroImages: Array<{
            id: string
            label: string
            prompt: string
        }>
        concept: {
            visualStyle: string
            technicalProfile?: string
        }
        hasReferenceImages: boolean
    }) => `Given these shots and hero images, determine the best image assignments and frame prompts:

SHOTS:
${params.shots.map((s) => `${s.orderIndex}. ${s.title}: ${s.description}`).join('\n')}

AVAILABLE HERO IMAGES:
${params.heroImages.map((img) => `- ID "${img.id}" (Label: "${img.label}"): ${img.prompt}`).join('\n')}

Visual Style: ${params.concept.visualStyle}
${params.concept.technicalProfile ? `Technical Profile: ${params.concept.technicalProfile}` : ''}
${params.hasReferenceImages ? 'User reference images (product/character) are also available.' : ''}

For each shot, provide:
- shotIndex: The shot number
- framePrompt: Detailed prompt for generating the start frame image. MUST include the technical specifications for consistency.
- heroImageIds: Array of hero image IDs to use as visual reference (use whenever a hero image matches the shot content)
- useReferenceImages: Whether to include user's reference images (true for any shot showing the product/character)

Be strategic - use hero images and references whenever their subjects appear to maintain consistency.`,

    schema: {
        type: 'object',
        properties: {
            assignments: {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        shotIndex: { type: 'number' },
                        framePrompt: { type: 'string' },
                        heroImageIds: { type: 'array', items: { type: 'string' } },
                        useReferenceImages: { type: 'boolean' },
                    },
                    required: ['shotIndex', 'framePrompt', 'heroImageIds', 'useReferenceImages'],
                },
            },
        },
        required: ['assignments'],
    },
}

// =====================
// STORYBOARD FRAME GENERATION
// Enhanced with technical profile and shot-to-shot context
// =====================
export const STORYBOARD_FRAME_PROMPTS = {
    startFrame: (params: {
        shotTitle: string
        shotDescription: string
        conceptVisualStyle: string
        technicalProfile?: string
        framePrompt: string
        previousShotContext?: string
        subjectDescription?: string
    }) => `[TECHNICAL SPECIFICATIONS]
${params.technicalProfile || 'Professional cinematic lighting, high quality'}

[VISUAL STYLE]
${params.conceptVisualStyle}

${params.subjectDescription ? `[SUBJECT ANCHORING]\nMaintain exact appearance: ${params.subjectDescription}` : ''}

[SCENE DESCRIPTION]
${params.framePrompt}

[SHOT CONTEXT]
Current Shot: "${params.shotTitle}"
Action: ${params.shotDescription}
${params.previousShotContext ? `Previous Shot: ${params.previousShotContext}\n→ MAINTAIN visual continuity: same lighting direction, color temperature, environment consistency.` : 'This is the opening shot - establish the visual foundation.'}

[GENERATION REQUIREMENTS]
- Create a photorealistic still frame matching the technical specifications EXACTLY
- Camera lens, lighting, and color grade must match the technical profile
- If subjects appeared in previous shots, maintain their EXACT appearance
- Use reference images for precise product/character representation
- This is the STARTING frame - show the initial moment before action begins`,

    endFrame: (params: {
        shotTitle: string
        shotDescription: string
        startFramePrompt: string
        technicalProfile?: string
    }) => `[TECHNICAL SPECIFICATIONS]
${params.technicalProfile || 'Professional cinematic lighting, high quality'}

Create the END frame for this shot, showing the final state:

Shot: "${params.shotTitle}"
Description: ${params.shotDescription}
Start Frame: ${params.startFramePrompt}

Show how this scene concludes while maintaining:
- Identical lighting and color grade as the start frame
- Same environment and atmosphere
- Visual continuity with subject positioning`,
}

// =====================
// MOTION PROMPT GENERATION
// Enhanced with cinematography terminology and flow continuity
// =====================
export const MOTION_PROMPTS = {
    system: `You are a professional Cinematographer specializing in AI video generation.
You describe CAMERA PHYSICS and SUBJECT MOTION using standard film terminology.

REQUIRED TERMINOLOGY - Use these exact terms:
Camera Moves:
- "Static" - No camera movement
- "Pan Left/Right" - Camera rotates horizontally on axis
- "Tilt Up/Down" - Camera rotates vertically on axis  
- "Dolly In/Out" - Camera moves toward/away from subject
- "Truck Left/Right" - Camera moves laterally
- "Boom Up/Down" - Camera moves vertically
- "Rack Focus" - Focus shifts between subjects
- "Zoom In/Out" - Lens focal length changes

Speed Descriptors:
- "Static" - No movement
- "Gentle/Slow" - Subtle, barely perceptible
- "Smooth/Steady" - Controlled, medium pace
- "Quick/Rapid" - Fast, dynamic
- "Whip" - Very fast motion blur

CRITICAL: Analyze the previous shot's motion to ensure fluid editing.
- If previous shot pans right, consider continuing or cutting to static
- Avoid conflicting motions (pan right → pan left) that cause viewer disorientation`,

    generate: (params: {
        shotTitle: string
        shotDescription: string
        voiceoverAction?: string
        conceptVisualStyle: string
        duration: number
        previousShotMotion?: string
        previousShotTitle?: string
    }) => `Define the camera and subject motion for this shot:

Shot: "${params.shotTitle}"
Duration: ${params.duration} seconds
Visual Description: ${params.shotDescription}
${params.voiceoverAction ? `Action/Voiceover: ${params.voiceoverAction}` : ''}
Visual Style: ${params.conceptVisualStyle}

${params.previousShotMotion ? `[CONTINUITY CONTEXT]\nPrevious Shot "${params.previousShotTitle}": ${params.previousShotMotion}\n→ Consider how this shot should flow from the previous one.` : '[CONTINUITY CONTEXT]\nThis is the opening shot.'}

Provide:
1. motionPrompt: Technical motion description for AI video (e.g., "Slow dolly in toward subject, subject turns head left to right, gentle ambient particle movement")
2. cameraMovementType: Single term (e.g., "Dolly In", "Pan Right", "Static")
3. transitionSuggestion: How to edit into next shot (e.g., "Hard cut", "Cross dissolve", "Match cut")

Be SPECIFIC and TECHNICAL. Avoid vague terms like "dynamic" or "cinematic movement."`,

    schema: {
        type: 'object',
        properties: {
            motionPrompt: { type: 'string' },
            cameraMovementType: { type: 'string' },
            subjectMotion: { type: 'string' },
            atmosphericChanges: { type: 'string' },
            transitionSuggestion: { type: 'string' },
        },
        required: ['motionPrompt', 'cameraMovementType'],
    },
}

// =====================
// VIDEO GENERATION
// Optimized structure for Veo 3 with consistency focus
// =====================
export const VIDEO_PROMPTS = {
    generate: (params: {
        shotTitle: string
        shotDescription: string
        motionPrompt: string
        technicalProfile?: string
        conceptVisualStyle: string
        subjectDescription?: string
    }) => `${params.technicalProfile || 'Cinematic, professional lighting'}. ${params.conceptVisualStyle}.

${params.subjectDescription ? `Subject: ${params.subjectDescription}` : ''}

Scene: ${params.shotDescription}

Camera: ${params.motionPrompt}

High fidelity commercial quality, consistent textures throughout, stable lighting, no flickering.`,

    // Enhanced negative prompt targeting common AI video artifacts
    negativePrompt: `morphing, shifting texture, flickering, disjointed background,
distorted features, text, watermark, bad anatomy, inconsistent lighting,
cartoonish, oversaturated, blurry, low bitrate, jittery motion, frame skip,
temporal inconsistency, character drift, scale changes, color shifting,
unnatural motion, jerky movement, artifacting, compression artifacts,
face distortion, hand distortion, limb deformation`,
}
