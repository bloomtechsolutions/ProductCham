import { rpc } from "@/lib/game";
import { fail, ok } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ code: string }> }) {
  try {
    const { code } = await params;
    const b = (await req.json()) as { name?: string; staffId?: string; department?: string };
    return ok(
      await rpc("join_game", {
        p_code: code,
        p_name: String(b.name ?? ""),
        p_staff_id: b.staffId ?? null,
        p_department: b.department ?? null,
      }),
    );
  } catch (e) {
    return fail(e);
  }
}
