import { control } from "@/lib/game";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const { hostToken, action } = (await req.json()) as { hostToken: string; action: string };
    const g = await control(code, hostToken, action);
    return ok({ phase: g.phase, qIndex: g.qIndex });
  } catch (e) {
    return fail(e);
  }
}
