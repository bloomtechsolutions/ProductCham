import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// All game logic lives in Postgres functions (see supabase/migrations). Tables are
// locked by RLS; these RPCs are the only way in, and they verify host/player tokens.
const db = url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  if (!db) throw new Error("Supabase is not configured (SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY).");
  const { data, error } = await db.rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}
