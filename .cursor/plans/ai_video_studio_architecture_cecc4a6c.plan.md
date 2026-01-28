---
name: AI Video Studio Architecture
overview: Complete architecture plan for an AI-powered video creation studio SaaS with guided workflow, multiple AI model integrations, async job processing, hybrid payment system, and built-in video editor.
todos:
  - id: db-schema
    content: Create database migrations for projects, scenes, generations, assets, jobs, subscriptions, credits, and workflow_steps tables with proper RLS policies
    status: pending
  - id: ai-providers
    content: Implement AI provider wrappers for OpenAI (GPT Image, Sora), Google (Veo), Kling, Nano Banana, and Eleven Labs with unified interface
    status: pending
  - id: job-queue
    content: Set up async job queue system for processing AI generations with status tracking, webhooks, and retry logic
    status: pending
    dependencies:
      - db-schema
  - id: workflow-engine
    content: Build workflow state management system with step validation, progress tracking, and prerequisite checking
    status: pending
    dependencies:
      - db-schema
  - id: project-crud
    content: Implement project and scene CRUD operations with Server Actions and queries
    status: pending
    dependencies:
      - db-schema
  - id: idea-generation
    content: Build idea generation step UI and backend integration with OpenAI GPT-4
    status: pending
    dependencies:
      - ai-providers
      - workflow-engine
      - project-crud
  - id: storyboard-script
    content: Implement storyboard and script generation step with scene-wise breakdown
    status: pending
    dependencies:
      - idea-generation
  - id: image-generation
    content: Build image storyboard generation (start/end frames) using GPT Image models
    status: pending
    dependencies:
      - storyboard-script
      - ai-providers
  - id: video-generation
    content: Implement video generation step with support for multiple AI models (Sora, Veo, Kling, etc.)
    status: pending
    dependencies:
      - image-generation
      - job-queue
  - id: audio-generation
    content: Build audio generation integration with Eleven Labs for voiceover and sound effects
    status: pending
    dependencies:
      - video-generation
      - ai-providers
  - id: video-editor
    content: Create built-in video editor with timeline, stitching, splitting, and basic editing tools
    status: pending
    dependencies:
      - video-generation
      - audio-generation
  - id: realtime-updates
    content: Implement real-time job status updates using Supabase Realtime subscriptions
    status: pending
    dependencies:
      - job-queue
  - id: credits-system
    content: Build credit system with balance tracking, transactions, and usage logging
    status: pending
    dependencies:
      - db-schema
  - id: subscription-system
    content: Implement subscription tiers with limits and monthly credit allowances
    status: pending
    dependencies:
      - credits-system
  - id: storage-setup
    content: Configure Supabase Storage buckets and implement file upload/download utilities
    status: pending
    dependencies:
      - db-schema
  - id: export-functionality
    content: Build video export system with FFmpeg processing and multiple format support
    status: pending
    dependencies:
      - video-editor
      - storage-setup
---

# AI Video Cr

eation Studio - Complete Architecture Plan

## System Overview

A full-stack SaaS platform for AI-powered video creation with a guided workflow from idea generation to final video export. The system uses async job processing, multiple AI model integrations, and a hybrid subscription + credits payment model.

## Architecture Components

### 1. Database Schema (Supabase)

**Core Tables:**

- `projects` - Video projects with workflow state
- `scenes` - Individual scenes within a project
- `generations` - AI generation jobs (text, images, video, audio)
- `assets` - Generated files (images, videos, audio) with storage references
- `subscriptions` - User subscription tiers and limits
- `credits` - Credit transactions and balance tracking
- `jobs` - Async job queue for AI processing
- `workflow_steps` - Tracks progress through guided workflow

**Key Relationships:**

```javascript
projects (1) -> (many) scenes
scenes (1) -> (many) generations
generations (1) -> (1) assets
projects (1) -> (many) workflow_steps
users (1) -> (1) subscriptions
users (1) -> (many) credits
```



### 2. Backend Architecture

**Server Actions** (`server/actions/`):

- `projects.ts` - Create, update, delete projects
- `scenes.ts` - Scene management
- `generations.ts` - Trigger AI generations
- `workflow.ts` - Workflow state management
- `credits.ts` - Credit balance and transactions
- `subscriptions.ts` - Subscription management

**API Routes** (`app/api/`):

- `/api/jobs/[id]/status` - Job status polling
- `/api/jobs/[id]/webhook` - Job completion webhooks
- `/api/generations/[id]/cancel` - Cancel generation
- `/api/video/export` - Export final video
- `/api/storage/upload` - Direct file uploads

**Job Queue System**:

- Use Supabase Edge Functions or external queue (BullMQ/Inngest)
- Process generations asynchronously
- Webhook callbacks on completion
- Retry logic for failed jobs
- Rate limiting per user/subscription tier

**AI Service Integrations** (`lib/ai/`):

- `providers/` - Wrapper classes for each AI service
- `openai.ts` - GPT Image 1/1.5, Sora
- `google.ts` - Veo 3.1
- `kling.ts` - Kling 2.5, Kling O1
- `nano-banana.ts` - Nano Banana
- `elevenlabs.ts` - Eleven Labs audio
- `types.ts` - Common interfaces for all providers
- `client.ts` - Unified AI client with provider selection

### 3. Workflow Engine

**Guided Workflow Steps:**

1. **Idea Generation** - AI generates video concept
2. **Storyboard & Script** - Scene-wise breakdown with text
3. **Hero/Master Shot** - Generate key visual reference
4. **Image Storyboard** - Start/end frames for each scene
5. **Video Generation** - Generate video clips per scene
6. **Audio Generation** - Voiceover, music, sound effects
7. **Video Editing** - Stitch, split, trim, transitions
8. **Export** - Final video render

**Workflow State Management:**

- Track current step per project
- Validate prerequisites before allowing next step
- Save progress automatically
- Allow step revisiting/regeneration

### 4. File Storage & Processing

**Supabase Storage Buckets:**

- `projects/[projectId]/images/` - Generated images
- `projects/[projectId]/videos/` - Generated video clips
- `projects/[projectId]/audio/` - Generated audio
- `projects/[projectId]/exports/` - Final exported videos

**Video Processing:**

- Use FFmpeg (via API route or Edge Function)
- Support common formats (MP4, WebM)
- Thumbnail generation
- Preview generation for editor

### 5. Frontend Architecture

**App Router Structure:**

```javascript
app/
├── (dashboard)/
│   ├── projects/
│   │   ├── [id]/
│   │   │   ├── page.tsx - Project overview
│   │   │   ├── workflow/
│   │   │   │   ├── idea/page.tsx
│   │   │   │   ├── storyboard/page.tsx
│   │   │   │   ├── hero-shot/page.tsx
│   │   │   │   ├── images/page.tsx
│   │   │   │   ├── videos/page.tsx
│   │   │   │   ├── audio/page.tsx
│   │   │   │   └── editor/page.tsx
│   │   │   └── export/page.tsx
│   │   └── new/page.tsx
│   ├── credits/page.tsx
│   └── settings/page.tsx
```

**Key Components** (`components/features/`):

- `workflow/` - Workflow step components
- `generation/` - Generation status, preview, controls
- `editor/` - Video editor interface
- `credits/` - Credit balance and purchase
- `projects/` - Project list and cards

**Real-time Updates:**

- Supabase Realtime subscriptions for job status
- Optimistic UI updates
- Progress indicators for long-running jobs

### 6. Video Editor Integration

**Editor Features:**

- Timeline-based editing
- Drag-and-drop scene reordering
- Trim/split video clips
- Transition effects
- Audio mixing
- Text overlays
- Export to various formats

**Implementation Options:**

- Custom canvas-based editor (complex)
- Integrate Remotion (React-based video)
- Use video.js or similar library
- Server-side rendering with FFmpeg

### 7. Payment & Credits System

**Subscription Tiers:**

- Free: Limited generations/month
- Pro: Higher limits + credits included
- Enterprise: Custom limits

**Credit System:**

- Each generation type costs credits
- Credits can be purchased separately
- Subscription includes monthly credit allowance
- Track usage and remaining credits

**Database Tables:**

- `subscriptions` - Tier, limits, renewal date
- `credit_transactions` - Purchases, usage, refunds
- `usage_logs` - Track generation costs

### 8. AI Model Integration Details

**Text Generation (Idea, Storyboard, Script):**

- OpenAI GPT-4 for structured output
- Zod schemas for validation
- Streaming responses for better UX

**Image Generation:**

- GPT Image 1/1.5 for storyboard frames
- Consistent style across scenes
- Prompt engineering for start/end frames

**Video Generation:**

- Route to appropriate model based on requirements
- Sora: High quality, longer videos
- Veo 3.1: Google's latest
- Kling 2.5/O1: Alternative options
- Nano Banana: Specialized use cases
- Model selection based on scene requirements

**Audio Generation:**

- Eleven Labs for voiceover
- Text-to-speech with voice selection
- Background music generation (if needed)

## Implementation Phases

### Phase 1: Foundation

1. Database schema migrations
2. Basic project CRUD
3. Authentication & authorization
4. File storage setup

### Phase 2: Core Workflow

1. Idea generation step
2. Storyboard & script generation
3. Basic UI for workflow navigation
4. Workflow state management

### Phase 3: AI Integrations

1. Text generation (OpenAI)
2. Image generation (GPT Image)
3. Video generation (start with one model)
4. Job queue system

### Phase 4: Advanced Features

1. Multiple video model support
2. Audio generation (Eleven Labs)
3. Real-time job status updates
4. Credit system

### Phase 5: Video Editor

1. Timeline component
2. Video stitching
3. Basic editing tools
4. Export functionality

### Phase 6: Polish & Scale

1. Payment integration
2. Subscription management
3. Performance optimization
4. Error handling & retries
5. Analytics & monitoring

## Key Files to Create/Modify

**Database Migrations:**

- `supabase/migrations/create_projects_table.sql`
- `supabase/migrations/create_scenes_table.sql`
- `supabase/migrations/create_generations_table.sql`
- `supabase/migrations/create_assets_table.sql`
- `supabase/migrations/create_jobs_table.sql`
- `supabase/migrations/create_subscriptions_table.sql`
- `supabase/migrations/create_credits_table.sql`
- `supabase/migrations/create_workflow_steps_table.sql`

**Backend:**

- `lib/ai/providers/openai.ts`
- `lib/ai/providers/google.ts`
- `lib/ai/providers/kling.ts`
- `lib/ai/providers/elevenlabs.ts`
- `lib/ai/client.ts`
- `lib/jobs/queue.ts`
- `lib/jobs/processor.ts`
- `server/actions/projects.ts`
- `server/actions/generations.ts`
- `server/actions/workflow.ts`
- `server/queries/projects.ts`
- `app/api/jobs/[id]/status/route.ts`
- `app/api/jobs/webhook/route.ts`

**Frontend:**

- `app/(dashboard)/projects/[id]/workflow/[step]/page.tsx` (multiple steps)
- `components/features/workflow/workflow-navigator.tsx`
- `components/features/generation/generation-card.tsx`
- `components/features/editor/video-timeline.tsx`