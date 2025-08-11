
export interface MusicBrief {
  titleSuggestion: string;
  overallMood: string;
  keyElements: string[];
  tempo: string;
  instrumentation: string[];
  musicalCues: MusicalCue[];
  negativeConstraints: string[];
}

export interface MusicalCue {
  timestamp: string;
  description: string;
}

export enum AppState {
  INPUT,
  LOADING,
  STUDIO,
}
