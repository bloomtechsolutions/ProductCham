import { Redis } from "@upstash/redis";

/**
 * Minimal key/value + hash store. Uses Upstash Redis when configured
 * (required on Vercel, since serverless instances don't share memory),
 * otherwise an in-memory fallback for local development.
 */
export interface Store {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSec: number): Promise<void>;
  hsetnx(key: string, field: string, value: string, ttlSec: number): Promise<boolean>;
  hset(key: string, field: string, value: string, ttlSec: number): Promise<void>;
  hget(key: string, field: string): Promise<string | null>;
  hgetall(key: string): Promise<Record<string, string>>;
  hlen(key: string): Promise<number>;
}

function redisStore(url: string, token: string): Store {
  const r = new Redis({ url, token, automaticDeserialization: false });
  return {
    async get(k) {
      return (await r.get<string>(k)) ?? null;
    },
    async set(k, v, ttl) {
      await r.set(k, v, { ex: ttl });
    },
    async hsetnx(k, f, v, ttl) {
      const ok = await r.hsetnx(k, f, v);
      await r.expire(k, ttl);
      return ok === 1;
    },
    async hset(k, f, v, ttl) {
      await r.hset(k, { [f]: v });
      await r.expire(k, ttl);
    },
    async hget(k, f) {
      return (await r.hget<string>(k, f)) ?? null;
    },
    async hgetall(k) {
      return ((await r.hgetall<Record<string, string>>(k)) ?? {}) as Record<string, string>;
    },
    async hlen(k) {
      return await r.hlen(k);
    },
  };
}

function memoryStore(): Store {
  const g = globalThis as unknown as { __mem?: { kv: Map<string, string>; h: Map<string, Map<string, string>> } };
  g.__mem ??= { kv: new Map(), h: new Map() };
  const { kv, h } = g.__mem;
  const hash = (k: string) => {
    if (!h.has(k)) h.set(k, new Map());
    return h.get(k)!;
  };
  return {
    async get(k) { return kv.get(k) ?? null; },
    async set(k, v) { kv.set(k, v); },
    async hsetnx(k, f, v) {
      const m = hash(k);
      if (m.has(f)) return false;
      m.set(f, v);
      return true;
    },
    async hset(k, f, v) { hash(k).set(f, v); },
    async hget(k, f) { return h.get(k)?.get(f) ?? null; },
    async hgetall(k) { return Object.fromEntries(h.get(k) ?? []); },
    async hlen(k) { return h.get(k)?.size ?? 0; },
  };
}

const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

export const usingRedis = Boolean(url && token);
export const store: Store = usingRedis ? redisStore(url!, token!) : memoryStore();
