// Types ported from reference project
export enum WorkflowStep {
  Ideation = 'ideation',
  Concepts = 'concepts',
  Storyline = 'storyline',
  HeroShot = 'hero_shot',
  Style = 'style',
  Storyboard = 'storyboard',
  Production = 'production',
  Audio = 'audio',
  Editor = 'editor',
  Video = 'video',
  Export = 'export',
}

export interface ConceptIdea {
  title: string;
  description: string;
  hook: string;
  visualStyle: string;
}

export interface StorylineShot {
  shotNumber: number;
  description: string;
  duration: string;
}

export interface StoryboardScene {
  shotNumber: number;
  description: string;
  startFrameDesc: string;
  endFrameDesc: string;
  duration: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface GenerationStatus {
  script: 'pending' | 'processing' | 'completed' | 'failed';
  image: 'pending' | 'processing' | 'completed' | 'failed';
  video: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface AdProject {
  id: string; // Added id for convenience
  prompt: string;
  title?: string; // Added title
  referenceImage?: string;
  referenceText?: string;
  selectedConcept?: ConceptIdea;
  storyline?: StorylineShot[];
  visualStyle?: string;
  userNotes?: string;
  uploadedFiles?: UploadedFile[];
  shotCount: number;
  totalLength: number;
  heroImage?: string;
  generatedConcepts?: ConceptIdea[]; // Persisted concept options
  storyboard: StoryboardScene[];
  scenes?: StudioScene[]; // Added scenes as it's used in the code
  workflowStep?: WorkflowStep;
}

// Extended Scene interface for the unified studio
export interface StudioScene extends StoryboardScene {
  id: string;
  isGenerated: boolean;
  generationStatus: GenerationStatus;
}

