export interface User {
  id: string;
  name: string;
  favoriteTeam?: string;
  theme?: string;
}

export interface Group {
  id: string;
  code: string;
  name: string;
  adminId: string;
  members: User[];
}

export interface Match {
  id: string;
  phase: string;
  groupName?: string;
  teamA: string;
  teamAFlagCode?: string;
  teamB: string;
  teamBFlagCode?: string;
  date: string; // ISO date string
  realScoreA?: number;
  realScoreB?: number;
  status: 'pending' | 'locked' | 'finished';
}

export interface Prediction {
  id: string;
  matchId: string;
  userId: string;
  groupId: string;
  scoreA: number;
  scoreB: number;
  points?: number; 
}

export interface BonusPrediction {
  userId: string;
  groupId: string;
  champion: string;
  topScorer: string;
}

export interface LeaderboardEntry {
  user: User;
  totalPoints: number;
  exactMatches: number; // 3 points
  correctResults: number; // 1 point
  roundPoints?: number;
  roundExactMatches?: number;
  predictionsInRound?: number;
  badges?: string[];
}
