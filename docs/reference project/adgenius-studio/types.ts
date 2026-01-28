
export enum AppStep {
  Ideation = 'Ideation',
  Concepts = 'Concepts',
  Config = 'Configuration',
  HeroShot = 'Hero Generation',
  Storyboard = 'Storyboard',
  Production = 'Production'
}

export interface ConceptIdea {
  title: string;
  description: string;
  hook: string;
  visualStyle: string;
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

export interface AdProject {
  prompt: string;
  referenceImage?: string;
  referenceText?: string;
  selectedConcept?: ConceptIdea;
  shotCount: number;
  totalLength: number;
  heroImage?: string;
  storyboard: StoryboardScene[];
}
