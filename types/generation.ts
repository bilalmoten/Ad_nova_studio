export type GenerationType = 'concept' | 'hero' | 'storyboard' | 'video' | 'audio';

export type GenerationStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Generation {
  id: string;
  projectId: string;
  sceneId?: string;
  type: GenerationType;
  status: GenerationStatus;
  modelUsed?: string;
  prompt?: string;
  resultData?: Record<string, unknown>;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
}

