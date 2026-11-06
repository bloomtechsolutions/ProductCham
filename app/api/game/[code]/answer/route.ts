import { rpc } from "@/lib/game";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const b = (await req.json()) as { playerId: string; token: string; qIndex: number; answer: boolean };
    if (typeof b.answer !== "boolean" || typeof b.qIndex !== "number") throw new Error("Bad request.");
    return ok(
      await rpc("submit_answer", {
        p_code: code, p_player_id: b.playerId, p_token: b.token, p_q_index: b.qIndex, p_answer: b.answer,
      }),
    );
  } catch (e) {
    return fail(e);
  }
}
