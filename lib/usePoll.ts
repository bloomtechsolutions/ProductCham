"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/** Polls a JSON endpoint; also returns clock offset (server - client) in ms. */
export function usePoll<T>(url: string | null, intervalMs: number) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const tick = useRef(0);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (!url) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const run = async () => {
      const id = ++tick.current;
      try {
        const t0 = Date.now();
        const res = await fetch(url, { cache: "no-store" });
        const json = await res.json();
        if (stop || id !== tick.current) return;
        if (!res.ok) setError(json.error ?? "Error");
        else {
          setError(null);
          setData(json);
          if (typeof json.serverNow === "number") {
            const t1 = Date.now();
            setOffset(json.serverNow - (t0 + t1) / 2);
          }
        }
      } catch {
        if (!stop) setError("Connection problem — retrying…");
      }
      if (!stop) timer = setTimeout(run, intervalMs);
    };
    run();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [url, intervalMs, nonce]);

  const refresh = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, offset, refresh };
}

/** Seconds remaining until a server timestamp, re-rendering ~10x/sec. */
export function useCountdown(endsAt: number | undefined, offset: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 100);
    return () => clearInterval(t);
  }, []);
  if (!endsAt) return 0;
  return Math.max(0, (endsAt - (now + offset)) / 1000);
}
