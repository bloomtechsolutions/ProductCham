import { submitAnswer } from "@/lib/game";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const b = (await req.json()) as { playerId: string; token: string; qIndex: number; answer: boolean };
    if (typeof b.answer !== "boolean" || typeof b.qIndex !== "number") throw new Error("Bad request.");
    const rec = await submitAnswer(code, b.playerId, b.token, b.qIndex, b.answer);
    return ok({ ms: rec.ms });
  } catch (e) {
    return fail(e);
  }
}
