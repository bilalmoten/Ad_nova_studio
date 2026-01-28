import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, sceneIds } = await request.json();

    // Verify project ownership
    const { data: project } = await supabase
      .from('projects')
      .select('id')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single();

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get scenes with video URLs
    const { data: scenes } = await supabase
      .from('scenes')
      .select('video_url, shot_number')
      .eq('project_id', projectId)
      .in('id', sceneIds)
      .order('shot_number');

    if (!scenes || scenes.length === 0) {
      return NextResponse.json({ error: 'No videos found' }, { status: 400 });
    }

    // For now, return a simple response
    // In production, you would use FFmpeg to stitch videos together
    // This is a placeholder that returns the first video URL
    // You'll need to implement actual video stitching with FFmpeg or a video processing service

    const videoUrls = scenes
      .filter((s) => s.video_url)
      .map((s) => s.video_url!);

    // TODO: Implement actual video stitching with FFmpeg
    // For now, we'll return a message indicating the export is queued
    // In production, you'd:
    // 1. Queue a job to process videos with FFmpeg
    // 2. Stitch videos together
    // 3. Upload to storage
    // 4. Return download URL

    return NextResponse.json({
      message: 'Video export queued',
      videoUrls,
      note: 'Video stitching with FFmpeg needs to be implemented. For now, videos are available individually.',
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Export failed' },
      { status: 500 }
    );
  }
}

