import { rpc } from "@/lib/game";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
    return ok(await rpc("create_game", { p_pin: pin ?? null }));
  } catch (e) {
    return fail(e);
  }
}

export async function GET() {
  try {
    return ok({ pinRequired: await rpc<boolean>("pin_required") });
  } catch (e) {
    return fail(e, 500);
  }
}
