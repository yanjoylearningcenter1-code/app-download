export type DifficultySet = 'A' | 'B' | 'C';

export interface WordSets {
  A: string[];
  B: string[];
  C: string[];
}

export interface GameConfig {
  sets: WordSets;
  isCustom: boolean;
}

export interface LevelProgress {
  level: DifficultySet;
  lastPlayed: number; // Unix timestamp
  stage: number; // Current forgetting curve stage (1, 2, 3...)
  history: number[]; // Array of past play timestamps
}

export interface AllProgress {
  A: LevelProgress;
  B: LevelProgress;
  C: LevelProgress;
}