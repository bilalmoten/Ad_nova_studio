import { createClient } from '@/lib/supabase/server';

export async function getProject(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get project
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !project) {
    return null;
  }

  // Get scenes
  const { data: scenes } = await supabase
    .from('scenes')
    .select('*')
    .eq('project_id', id)
    .order('shot_number');

  // Get generations
  const { data: generations } = await supabase
    .from('generations')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false });

  return {
    ...project,
    scenes: scenes || [],
    generations: generations || [],
  };
}

export async function getUserProjects() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return projects || [];
}

export async function getProjectGenerations(projectId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  // Verify project ownership
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (!project) {
    return [];
  }

  const { data: generations, error } = await supabase
    .from('generations')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    return [];
  }

  return generations || [];
}

export async function getDashboardData() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get all projects for the user
  const { data: allProjects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id);

  const projectIds = (allProjects || []).map(p => p.id);

  // Get recent projects (last 5)
  const { data: recentProjects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get total generations count
  const { count: totalGenerations } = await supabase
    .from('generations')
    .select('*', { count: 'exact', head: true })
    .in('project_id', projectIds);

  // Get recent generations (last 3)
  const { data: recentGenerations } = await supabase
    .from('generations')
    .select(`
      *,
      projects (
        title
      )
    `)
    .in('project_id', projectIds)
    .order('created_at', { ascending: false })
    .limit(3);

  return {
    recentProjects: recentProjects || [],
    totalProjects: projectIds.length,
    totalGenerations: totalGenerations || 0,
    recentGenerations: recentGenerations || [],
  };
}
