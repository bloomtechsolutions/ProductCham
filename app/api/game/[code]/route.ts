import {
  answerCount, getAnswer, getAnswers, getGame, getPlayer, getPlayers, getScore, leaderboard,
} from "@/lib/game";
import { fail, ok } from "@/lib/http";
import { QUESTIONS } from "@/lib/questions";

export const dynamic = "force-dynamic";

// Polled by host screen (?host=<token>) and players (?player=<id>).
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const url = new URL(req.url);
    const hostToken = url.searchParams.get("host");
    const playerId = url.searchParams.get("player");

    const g = await getGame(code);
    if (!g) return fail(new Error("Game not found."), 404);

    const q = g.qIndex >= 0 ? QUESTIONS[g.qIndex] : null;
    const showQ = g.phase === "question" || g.phase === "reveal";
    const base = {
      code: g.code,
      phase: g.phase,
      qIndex: g.qIndex,
      total: QUESTIONS.length,
      endsAt: g.endsAt,
      serverNow: Date.now(),
      question: showQ && q ? { category: q.category, text: q.text } : null,
      reveal: g.phase === "reveal" && q ? { answer: q.answer, explanation: q.explanation } : null,
    };

    if (hostToken) {
      if (hostToken !== g.hostToken) return fail(new Error("Not authorised."), 401);
      const players = await getPlayers(code);
      let answered = 0;
      let stats: { trueCount: number; falseCount: number; correctCount: number; fastest: { name: string; ms: number }[] } | null = null;
      if (g.phase === "question") answered = await answerCount(code, g.qIndex);
      if (g.phase === "reveal") {
        const ans = await getAnswers(code, g.qIndex);
        const names = Object.fromEntries(players.map((p) => [p.id, p.name]));
        const list = Object.entries(ans);
        answered = list.length;
        stats = {
          trueCount: list.filter(([, a]) => a.answer).length,
          falseCount: list.filter(([, a]) => !a.answer).length,
          correctCount: list.filter(([, a]) => a.correct).length,
          fastest: list
            .filter(([, a]) => a.correct)
            .sort((a, b) => a[1].ms - b[1].ms)
            .slice(0, 3)
            .map(([id, a]) => ({ name: names[id] ?? "?", ms: a.ms })),
        };
      }
      const board = g.phase === "reveal" || g.phase === "finished" ? await leaderboard(code) : null;
      return ok({ ...base, players: players.map((p) => p.name), answered, stats, leaderboard: board });
    }

    if (playerId) {
      const p = await getPlayer(code, playerId);
      if (!p) return ok({ ...base, me: null });
      const myAnswer = showQ ? await getAnswer(code, g.qIndex, playerId) : null;
      let me: Record<string, unknown> = { name: p.name, answered: Boolean(myAnswer) };
      if (g.phase === "reveal") {
        const s = await getScore(code, playerId);
        me = { ...me, answer: myAnswer?.answer ?? null, correct: myAnswer?.correct ?? false, ms: myAnswer?.ms ?? null, score: s.score };
      }
      if (g.phase === "finished") {
        const board = await leaderboard(code);
        const mine = board.find((r) => r.id === playerId);
        me = { ...me, rank: mine?.rank, score: mine?.score ?? 0, timeMs: mine?.timeMs ?? 0, of: board.length };
        return ok({ ...base, me, leaderboard: board.slice(0, 3) });
      }
      return ok({ ...base, me });
    }

    return ok(base);
  } catch (e) {
    return fail(e, 500);
  }
}
