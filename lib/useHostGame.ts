"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useCountdown, usePoll } from "./usePoll";
import type { HostState } from "./types";

/** Polls host state, exposes control actions, and auto-reveals when time is up or all have answered. */
export function useHostGame(code: string, hostToken: string, autoReveal = true) {
  const { data, error, offset, refresh } = usePoll<HostState>(
    `/api/game/${code}?host=${encodeURIComponent(hostToken)}`,
    1000,
  );
  const remaining = useCountdown(data?.phase === "question" ? data.endsAt : undefined, offset);
  const [busy, setBusy] = useState(false);
  const revealSent = useRef(-1);

  const act = useCallback(
    async (action: string) => {
      setBusy(true);
      try {
        await fetch(`/api/game/${code}/control`, { method: "POST", body: JSON.stringify({ hostToken, action }) });
        refresh();
      } finally {
        setBusy(false);
      }
    },
    [code, hostToken, refresh],
  );

  useEffect(() => {
    if (!autoReveal || !data || data.phase !== "question" || revealSent.current === data.qIndex) return;
    const allIn = data.players.length > 0 && data.answered >= data.players.length;
    if (remaining <= 0 || allIn) {
      revealSent.current = data.qIndex;
      act("reveal");
    }
  }, [autoReveal, data, remaining, act]);

  return { data, error, remaining, busy, act };
}
