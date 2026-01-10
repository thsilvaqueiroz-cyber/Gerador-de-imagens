
export interface GenerationResult {
  id: string;
  url: string;
  variationType: string;
}

export enum AppState {
  IDLE = 'IDLE',
  GENERATING = 'GENERATING',
  ERROR = 'ERROR',
  COMPLETED = 'COMPLETED'
}

export interface VariationConfig {
  label: string;
  prompt: string;
}
