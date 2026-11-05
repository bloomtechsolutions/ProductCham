import { createGame } from "@/lib/game";
import { fail, ok } from "@/lib/http";
import { usingRedis } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { pin } = (await req.json().catch(() => ({}))) as { pin?: string };
    const required = process.env.HOST_PIN;
    if (required && pin !== required) return fail(new Error("Incorrect host PIN."), 401);
    if (!usingRedis && process.env.VERCEL) {
      return fail(new Error("No Redis store configured. Connect an Upstash Redis store to this Vercel project."), 500);
    }
    const g = await createGame();
    return ok({ code: g.code, hostToken: g.hostToken });
  } catch (e) {
    return fail(e, 500);
  }
}

export async function GET() {
  return ok({ pinRequired: Boolean(process.env.HOST_PIN), storage: usingRedis ? "redis" : "memory" });
}
