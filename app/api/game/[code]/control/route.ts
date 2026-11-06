import { rpc } from "@/lib/game";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { hostToken, action } = (await req.json()) as { hostToken: string; action: string };
    return ok(await rpc("host_control", { p_code: code, p_host_token: hostToken, p_action: action }));
  } catch (e) {
    return fail(e);
  }
}
