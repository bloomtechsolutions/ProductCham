import { randomBytes, randomInt } from "crypto";
import { store } from "./store";
import { QUESTIONS, QUESTION_TIME_MS } from "./questions";

const TTL = 60 * 60 * 12; // keep game data 12h

export type Phase = "lobby" | "question" | "reveal" | "finished";

export interface GameState {
  code: string;
  hostToken: string;
  phase: Phase;
  qIndex: number;
  startedAt: number; // when current question opened (server ms)
  endsAt: number;
  createdAt: number;
}

export interface Player { id: string; name: string; token: string; joinedAt: number }
export interface AnswerRec { answer: boolean; ms: number; correct: boolean }
export interface ScoreRec { score: number; timeMs: number }

export interface LeaderRow {
  rank: number;
  id: string;
  name: string;
  score: number;
  timeMs: number;
  tieBrokenByTime: boolean; // shares score with a neighbour, so time decided the order
}

const k = {
  game: (c: string) => `g:${c}`,
  players: (c: string) => `g:${c}:p`,
  answers: (c: string, q: number) => `g:${c}:a:${q}`,
  scores: (c: string) => `g:${c}:s`,
};

const token = () => randomBytes(16).toString("hex");

export async function getGame(code: string): Promise<GameState | null> {
  const raw = await store.get(k.game(code));
  return raw ? (JSON.parse(raw) as GameState) : null;
}

async function saveGame(g: GameState) {
  await store.set(k.game(g.code), JSON.stringify(g), TTL);
}

export async function createGame(): Promise<GameState> {
  let code = "";
  for (let i = 0; i < 20; i++) {
    code = String(randomInt(100000, 999999));
    if (!(await getGame(code))) break;
  }
  const g: GameState = {
    code,
    hostToken: token(),
    phase: "lobby",
    qIndex: -1,
    startedAt: 0,
    endsAt: 0,
    createdAt: Date.now(),
  };
  await saveGame(g);
  return g;
}

export async function joinGame(code: string, name: string) {
  const g = await getGame(code);
  if (!g) throw new Error("Game not found. Check the code.");
  if (g.phase === "finished") throw new Error("This game has already finished.");
  const clean = name.trim().replace(/\s+/g, " ").slice(0, 24);
  if (!clean) throw new Error("Please enter your name.");
  const existing = Object.values(await store.hgetall(k.players(code))).map((v) => JSON.parse(v) as Player);
  if (existing.some((p) => p.name.toLowerCase() === clean.toLowerCase())) {
    throw new Error("That name is already taken — add your staff ID or initial.");
  }
  const p: Player = { id: token().slice(0, 12), name: clean, token: token(), joinedAt: Date.now() };
  await store.hset(k.players(code), p.id, JSON.stringify(p), TTL);
  return p;
}

export async function getPlayer(code: string, id: string): Promise<Player | null> {
  const raw = await store.hget(k.players(code), id);
  return raw ? (JSON.parse(raw) as Player) : null;
}

export async function submitAnswer(code: string, playerId: string, playerToken: string, qIndex: number, answer: boolean) {
  const now = Date.now();
  const g = await getGame(code);
  if (!g) throw new Error("Game not found.");
  const p = await getPlayer(code, playerId);
  if (!p || p.token !== playerToken) throw new Error("Not a player in this game.");
  if (g.phase !== "question" || g.qIndex !== qIndex) throw new Error("This question is closed.");
  if (now > g.endsAt + 750) throw new Error("Time's up!");

  const ms = Math.max(0, now - g.startedAt);
  const correct = QUESTIONS[qIndex].answer === answer;
  const rec: AnswerRec = { answer, ms, correct };
  const fresh = await store.hsetnx(k.answers(code, qIndex), playerId, JSON.stringify(rec), TTL);
  if (!fresh) throw new Error("You already answered this question.");

  if (correct) {
    // Only one open question at a time, and hsetnx guarantees one answer per
    // player per question, so this read-modify-write cannot race for a player.
    const prev = await store.hget(k.scores(code), playerId);
    const s: ScoreRec = prev ? JSON.parse(prev) : { score: 0, timeMs: 0 };
    s.score += 1;
    s.timeMs += ms;
    await store.hset(k.scores(code), playerId, JSON.stringify(s), TTL);
  }
  return rec;
}

export async function control(code: string, hostToken: string, action: string) {
  const g = await getGame(code);
  if (!g) throw new Error("Game not found.");
  if (g.hostToken !== hostToken) throw new Error("Not authorised to host this game.");

  const openQuestion = (i: number) => {
    const now = Date.now();
    g.phase = "question";
    g.qIndex = i;
    g.startedAt = now;
    g.endsAt = now + QUESTION_TIME_MS;
  };

  switch (action) {
    case "start":
      if (g.phase !== "lobby") throw new Error("Game already started.");
      openQuestion(0);
      break;
    case "reveal":
      if (g.phase !== "question") return g; // idempotent
      g.phase = "reveal";
      g.endsAt = Math.min(g.endsAt, Date.now());
      break;
    case "next":
      if (g.phase !== "reveal") return g;
      if (g.qIndex + 1 >= QUESTIONS.length) g.phase = "finished";
      else openQuestion(g.qIndex + 1);
      break;
    case "end":
      g.phase = "finished";
      break;
    default:
      throw new Error("Unknown action.");
  }
  await saveGame(g);
  return g;
}

export async function getPlayers(code: string): Promise<Player[]> {
  return Object.values(await store.hgetall(k.players(code)))
    .map((v) => JSON.parse(v) as Player)
    .sort((a, b) => a.joinedAt - b.joinedAt);
}

export async function getAnswers(code: string, q: number): Promise<Record<string, AnswerRec>> {
  const raw = await store.hgetall(k.answers(code, q));
  return Object.fromEntries(Object.entries(raw).map(([id, v]) => [id, JSON.parse(v) as AnswerRec]));
}

export async function getAnswer(code: string, q: number, playerId: string): Promise<AnswerRec | null> {
  const raw = await store.hget(k.answers(code, q), playerId);
  return raw ? (JSON.parse(raw) as AnswerRec) : null;
}

export async function answerCount(code: string, q: number) {
  return store.hlen(k.answers(code, q));
}

export async function getScore(code: string, playerId: string): Promise<ScoreRec> {
  const raw = await store.hget(k.scores(code), playerId);
  return raw ? JSON.parse(raw) : { score: 0, timeMs: 0 };
}

/**
 * Ranking: most correct answers wins. If scores are level, the player with the
 * lowest total response time across their correct answers ranks higher.
 */
export async function leaderboard(code: string): Promise<LeaderRow[]> {
  const [players, scoresRaw] = await Promise.all([getPlayers(code), store.hgetall(k.scores(code))]);
  const rows = players.map((p) => {
    const s: ScoreRec = scoresRaw[p.id] ? JSON.parse(scoresRaw[p.id]) : { score: 0, timeMs: 0 };
    return { id: p.id, name: p.name, score: s.score, timeMs: s.timeMs };
  });
  rows.sort((a, b) => b.score - a.score || a.timeMs - b.timeMs || a.name.localeCompare(b.name));
  return rows.map((r, i) => ({
    ...r,
    rank: i + 1,
    tieBrokenByTime:
      r.score > 0 &&
      ((i > 0 && rows[i - 1].score === r.score) || (i < rows.length - 1 && rows[i + 1].score === r.score)),
  }));
}
