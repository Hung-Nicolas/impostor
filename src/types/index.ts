export interface Player {
  id: number;
  name: string;
  isImpostor: boolean;
  word: string;
  impostorHint?: string;
  eliminated: boolean;
  avatarColor: string;
  score: number;
  active: boolean;
}

export interface Word {
  id: string;
  word: string;
  hints: string[];
  category?: string;
}

export interface Pack {
  id: string;
  user_id: string | null;
  name: string;
  description: string;
  category: string;
  is_public: boolean;
  words: Word[];
  likes_count: number;
  uses_count: number;
  downloads_count: number;
  source_pack_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GameResults {
  impostorIndices: number[];
  winner: 'crewmates' | 'impostors' | 'chaos';
  chaosResult?: string;
  roundWord: string;
  impostorWord: string;
  totalRounds: number;
  eliminatedPlayers: { name: string; wasImpostor: boolean; round: number }[];
  survivingPlayers: string[];
}

export type GamePhase = 'idle' | 'setup' | 'revealing' | 'discussion' | 'voting' | 'results';
export type GameMode = 'normal' | 'caos';

export interface RoundState {
  roundNumber: number;
  currentPlayerRevealIndex: number;
  discussionTime: number;
  votesCast: Record<number, number>;
}
