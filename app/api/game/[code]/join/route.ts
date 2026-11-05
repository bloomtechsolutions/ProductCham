import { joinGame } from "@/lib/game";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { name } = (await req.json()) as { name: string };
    const p = await joinGame(code, String(name ?? ""));
    return ok({ playerId: p.id, token: p.token, name: p.name });
  } catch (e) {
    return fail(e);
  }
}
