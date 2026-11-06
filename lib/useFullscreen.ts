"use client";
import { useCallback, useEffect, useState } from "react";

export function useFullscreen() {
  const [isFull, setIsFull] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(Boolean(document.fullscreenEnabled));
    const onChange = () => setIsFull(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggle = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen?.().catch(() => {});
  }, []);

  // Press "F" to toggle (ignored while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "f" || e.key === "F") toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  return { isFull, supported, toggle };
}
