export interface LeaderRow {
  rank: number; id: string; name: string; staffId?: string | null; department?: string | null;
  score: number; timeMs: number; tieBrokenByTime?: boolean;
}
export interface PublicState {
  code: string;
  phase: "lobby" | "question" | "reveal" | "finished";
  qIndex: number;
  total: number;
  questionSeconds: number;
  endsAt: number;
  serverNow: number;
  question: { category: string; text: string } | null;
  reveal: { answer: boolean; explanation: string } | null;
}
export interface HostState extends PublicState {
  players: string[];
  answered: number;
  stats: { trueCount: number; falseCount: number; correctCount: number; fastest: { name: string; ms: number }[] } | null;
  leaderboard: LeaderRow[] | null;
}
export const secs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;

export const EVENT = "Refresher Training 2026";
export const ACTIVITY = "Product Champion";

export function catClass(category?: string) {
  switch (category) {
    case "Accounts": return "cat-accounts";
    case "Cards": return "cat-cards";
    case "Financing": return "cat-financing";
    default: return "cat-business";
  }
}
