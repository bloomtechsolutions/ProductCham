import { rpc } from "@/lib/game";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f-]{36}$/i;

// Polled by the host screen (?host=<token>) and by players (?player=<id>).
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const sp = new URL(req.url).searchParams;
    const player = sp.get("player");
    const state = await rpc("game_state", {
      p_code: code,
      p_host_token: sp.get("host"),
      p_player_id: player && UUID.test(player) ? player : null,
    });
    return ok(state);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    return fail(e, msg.startsWith("Game not found") ? 404 : msg.startsWith("Not authorised") ? 401 : 500);
  }
}
