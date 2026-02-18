
export interface Verb {
  id: string;
  v1: string;
  v2: string;
  v3: string;
  meaning: string;
  example: string;
  // SRS Fields
  interval: number; // in days
  easeFactor: number;
  repetitions: number;
  nextReview: number; // timestamp
  status: 'new' | 'learning' | 'review' | 'mastered';
}

export type ViewMode = 'practice' | 'list' | 'stats';
export type ConfidenceLevel = 'again' | 'hard' | 'good' | 'easy';
