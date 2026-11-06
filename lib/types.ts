export interface LeaderRow { rank: number; id: string; name: string; staffId?: string | null; department?: string | null; score: number; timeMs: number; tieBrokenByTime?: boolean }
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
export const secs = (ms: number) => `${(ms / 1000).toFixed(2)}s`;
