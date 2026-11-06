"use client";
import { useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { ExpandIcon, ScreenIcon, ShrinkIcon } from "@/components/Icons";
import { Board, Stage } from "@/components/Stage";
import { ACTIVITY, EVENT } from "@/lib/types";
import { useFullscreen } from "@/lib/useFullscreen";
import { useHostGame } from "@/lib/useHostGame";

const KEY = "bmlpc:host";
type Session = { code: string; hostToken: string };

export default function HostPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [pin, setPin] = useState("");
  const [pinRequired, setPinRequired] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw));
    } catch {}
    setLoaded(true);
    fetch("/api/game").then((r) => r.json()).then((j) => setPinRequired(Boolean(j.pinRequired))).catch(() => {});
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/game", { method: "POST", body: JSON.stringify({ pin }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      const s = { code: j.code, hostToken: j.hostToken };
      try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
      setSession(s);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not create game");
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    try { localStorage.removeItem(KEY); } catch {}
    setSession(null);
  };

  if (!loaded) return null;
  if (session) return <HostGame session={session} onReset={reset} />;

  return (
    <>
      <header className="topbar"><Brand /></header>
      <main className="wrap narrow">
        <form className="hero" onSubmit={create}>
          <div>
            <div className="eyebrow">{EVENT}</div>
            <h1>Host <span>{ACTIVITY}</span></h1>
          </div>
          <p className="muted" style={{ fontSize: "1.1rem", margin: 0 }}>
            Create a game, then open the presentation screen on the projector. Players scan the QR code to register.
          </p>
          {pinRequired && (
            <label className="field">
              <span>Host PIN</span>
              <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} autoFocus />
            </label>
          )}
          {err && <div className="err">{err}</div>}
          <button className="btn lg" disabled={busy}>{busy ? "Creating…" : "Create game"}</button>
        </form>
      </main>
    </>
  );
}

function HostGame({ session, onReset }: { session: Session; onReset: () => void }) {
  const { code, hostToken } = session;
  const { data, error, remaining, busy, act } = useHostGame(code, hostToken);
  const fs = useFullscreen();
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const joinUrl = origin ? `${origin}/join?code=${code}` : "";
  const screenUrl = `/screen/${code}?k=${hostToken}`;

  if (error === "Game not found." || error === "Not authorised.") {
    return (
      <main className="wrap narrow stack" style={{ paddingTop: 48 }}>
        <div className="err">{error}</div>
        <button className="btn" onClick={onReset}>Start a new game</button>
      </main>
    );
  }
  if (!data) return <main className="wrap"><p className="muted">Loading…</p></main>;

  const primary = (() => {
    switch (data.phase) {
      case "lobby": return { label: `Start game (${data.players.length} players)`, action: "start", disabled: data.players.length === 0 };
      case "question": return { label: "Reveal answer now", action: "reveal", disabled: false };
      case "reveal": return { label: data.qIndex + 1 >= data.total ? "Show final results" : "Next question", action: "next", disabled: false };
      default: return null;
    }
  })();

  const status =
    data.phase === "lobby" ? "Lobby — waiting for players"
    : data.phase === "question" ? `Question ${data.qIndex + 1} of ${data.total} · ${Math.ceil(remaining)}s left · ${data.answered}/${data.players.length} answered`
    : data.phase === "reveal" ? `Answer revealed · Question ${data.qIndex + 1} of ${data.total}`
    : "Game finished";

  return (
    <>
      <header className="topbar">
        <Brand />
        <div className="meta">
          <span className="pill">Game {code}</span>
          <a className="btn sm ghost" href={screenUrl} target="_blank" rel="noopener">
            <ScreenIcon />Open presentation screen
          </a>
          {fs.supported && (
            <button className="btn sm ghost" onClick={fs.toggle} title="Fullscreen (F)">
              {fs.isFull ? <ShrinkIcon /> : <ExpandIcon />}{fs.isFull ? "Exit fullscreen" : "Fullscreen"}
            </button>
          )}
        </div>
      </header>

      {error && <div className="wrap"><div className="err">{error}</div></div>}
      <Stage data={data} joinUrl={joinUrl} remaining={remaining} docked />

      {data.phase === "finished" && data.leaderboard && (
        <div className="wrap stack">
          <div className="card stack">
            <div className="row between">
              <h2>Full results</h2>
              <span className="muted">Ranked by score, then fastest total answer time</span>
            </div>
            <Board rows={data.leaderboard} full />
          </div>
        </div>
      )}

      <div className="dock">
        <span className="status">{status}</span>
        <div className="row">
          {data.phase !== "finished" && data.phase !== "lobby" && (
            <button className="btn ghost" disabled={busy} onClick={() => confirm("End the game now and show results?") && act("end")}>
              End game
            </button>
          )}
          {data.phase === "finished" && <button className="btn ghost" onClick={onReset}>Host a new game</button>}
          {primary && (
            <button className="btn" disabled={busy || primary.disabled} onClick={() => act(primary.action)}>{primary.label}</button>
          )}
        </div>
      </div>
    </>
  );
}
