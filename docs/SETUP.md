# AI Video Studio Setup Guide

## Prerequisites

1. Node.js 18+ installed
2. Supabase CLI installed (`brew install supabase/tap/supabase`)
3. Google GenAI API key

## Initial Setup

### 1. Environment Variables

Create or update your `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_GENAI_API_KEY=your-google-genai-api-key
```

**Important:** You must add `GOOGLE_GENAI_API_KEY` to your `.env.local` file. You can get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Start Supabase

```bash
npm run db:start
```

This will output your local Supabase credentials. Update `.env.local` with the values.

### 3. Run Migrations

```bash
npm run db:reset
```

This will apply all database migrations.

### 4. Generate TypeScript Types

```bash
npm run db:types
```

### 5. Set Up Storage Bucket

Create a storage bucket named `assets` in your Supabase project:

1. Go to Supabase Dashboard → Storage
2. Create a new bucket named `assets`
3. Set it to private (not public)
4. Configure policies to allow authenticated users to upload/read their own files

Or use the Supabase CLI:

```bash
supabase storage create assets --public false
```

### 6. Install Dependencies

```bash
npm install
```

### 7. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app.

## Project Structure

- `/app/(dashboard)/projects` - Project management pages
- `/components/features/workflow` - Workflow step components
- `/components/features/editor` - Video editor components
- `/lib/ai/providers` - AI service providers
- `/server/actions` - Server actions for mutations
- `/server/queries` - Database queries
- `/supabase/migrations` - Database migrations

## Workflow Steps

1. **Ideation** - Input prompt and optional reference image
2. **Concepts** - AI generates 3 ad concepts
3. **Configuration** - Select concept, set shot count & duration
4. **Hero Shot** - Generate master visual
5. **Storyboard** - Generate scene-by-scene breakdown
6. **Production** - Generate videos for each scene
7. **Editor** - Stitch, trim, and edit videos
8. **Export** - Final video render

## Notes

- Video export currently returns individual video URLs. Full FFmpeg stitching needs to be implemented.
- The editor uses react-draggable for timeline functionality.
- All AI operations are server-side only for security.

