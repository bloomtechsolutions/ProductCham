"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { ExpandIcon, ShrinkIcon } from "@/components/Icons";
import { Stage } from "@/components/Stage";
import { useFullscreen } from "@/lib/useFullscreen";
import { useHostGame } from "@/lib/useHostGame";

/** Projector view: no controls, fullscreen button (or press F). */
export default function ScreenPage() {
  const { code } = useParams<{ code: string }>();
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const key = `bmlpc:screen:${code}`;
    const k = new URLSearchParams(window.location.search).get("k");
    if (k) {
      setToken(k);
      try { localStorage.setItem(key, k); } catch {}
      window.history.replaceState(null, "", `/screen/${code}`);
    } else {
      try {
        const host = JSON.parse(localStorage.getItem("bmlpc:host") ?? "null");
        setToken(localStorage.getItem(key) ?? (host?.code === code ? host.hostToken : null));
      } catch {}
    }
    setLoaded(true);
  }, [code]);

  if (!loaded) return null;
  if (!token) {
    return (
      <main className="wrap narrow stack" style={{ paddingTop: 64 }}>
        <Brand />
        <p className="muted">Open this screen from the host page using “Open presentation screen”.</p>
        <Link className="btn" href="/host">Go to host page</Link>
      </main>
    );
  }
  return <Screen code={code} token={token} />;
}

function Screen({ code, token }: { code: string; token: string }) {
  const { data, error, remaining } = useHostGame(code, token);
  const fs = useFullscreen();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);

  return (
    <>
      <header className="topbar">
        <Brand />
        <div className="meta">
          {data && data.phase !== "lobby" && <span className="pill">Join code {code}</span>}
          <span className="pill">{data ? `${data.players.length} players` : "…"}</span>
        </div>
      </header>
      {error && !data && <div className="wrap"><div className="err">{error}</div></div>}
      {data ? (
        <Stage data={data} joinUrl={origin ? `${origin}/join?code=${code}` : ""} remaining={remaining} />
      ) : (
        !error && <div className="wrap muted">Loading…</div>
      )}
      {fs.supported && (
        <button className="btn sm ghost fs-btn" onClick={fs.toggle} title="Fullscreen (F)">
          {fs.isFull ? <ShrinkIcon /> : <ExpandIcon />}{fs.isFull ? "Exit" : "Fullscreen"}
        </button>
      )}
    </>
  );
}
