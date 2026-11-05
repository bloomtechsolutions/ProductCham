"use client";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import { useCountdown, usePoll } from "@/lib/usePoll";
import { LeaderRow, PublicState, secs } from "@/lib/types";

interface HostState extends PublicState {
  players: string[];
  answered: number;
  stats: { trueCount: number; falseCount: number; correctCount: number; fastest: { name: string; ms: number }[] } | null;
  leaderboard: LeaderRow[] | null;
}

const KEY = "bmlpc:host";
const QUESTION_SECONDS = 20;

export default function HostPage() {
  const [session, setSession] = useState<{ code: string; hostToken: string } | null>(null);
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

  const create = async () => {
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

  if (!session) {
    return (
      <>
        <div className="header"><b>BML Product Champion</b><small>Host</small></div>
        <main className="wrap narrow stack" style={{ paddingTop: 48 }}>
          <h1>Host a new game</h1>
          <p className="muted">Show this screen on a projector. Players scan the QR code to join.</p>
          {pinRequired && (
            <input type="password" placeholder="Host PIN" value={pin} onChange={(e) => setPin(e.target.value)} />
          )}
          {err && <div className="err">{err}</div>}
          <button className="btn" onClick={create} disabled={busy}>{busy ? "Creating…" : "Create game"}</button>
        </main>
      </>
    );
  }

  return <HostGame session={session} onReset={reset} />;
}

function HostGame({ session, onReset }: { session: { code: string; hostToken: string }; onReset: () => void }) {
  const { code, hostToken } = session;
  const { data, error, offset, refresh } = usePoll<HostState>(
    `/api/game/${code}?host=${encodeURIComponent(hostToken)}`,
    1000,
  );
  const remaining = useCountdown(data?.phase === "question" ? data.endsAt : undefined, offset);
  const [busy, setBusy] = useState(false);
  const [joinUrl, setJoinUrl] = useState("");
  const revealSent = useRef<number>(-1);

  useEffect(() => setJoinUrl(`${window.location.origin}/join?code=${code}`), [code]);

  const act = async (action: string) => {
    setBusy(true);
    try {
      await fetch(`/api/game/${code}/control`, { method: "POST", body: JSON.stringify({ hostToken, action }) });
      refresh();
    } finally {
      setBusy(false);
    }
  };

  // Auto-reveal when time runs out or everyone has answered.
  useEffect(() => {
    if (!data || data.phase !== "question" || revealSent.current === data.qIndex) return;
    const allIn = data.players.length > 0 && data.answered >= data.players.length;
    if (remaining <= 0 || allIn) {
      revealSent.current = data.qIndex;
      act("reveal");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, remaining]);

  if (error === "Game not found." || error === "Not authorised.") {
    return (
      <main className="wrap narrow stack" style={{ paddingTop: 48 }}>
        <div className="err">{error}</div>
        <button className="btn" onClick={onReset}>Start a new game</button>
      </main>
    );
  }
  if (!data) return <main className="wrap"><p className="muted">Loading…</p></main>;

  return (
    <>
      <div className="header">
        <b>BML Product Champion</b>
        <small>Game {code} · {data.players.length} players</small>
      </div>
      <main className="wrap stack">
        {error && <div className="err">{error}</div>}

        {data.phase === "lobby" && (
          <div className="grid2">
            <div className="card stack center" style={{ alignItems: "center" }}>
              <h2>Scan to join</h2>
              {joinUrl && <QRCodeSVG value={joinUrl} size={300} marginSize={2} style={{ width: "100%", maxWidth: 320, height: "auto" }} />}
              <div className="muted">or go to <b>{joinUrl.replace(/^https?:\/\//, "").replace(/\?.*$/, "")}</b> and enter</div>
              <div className="code">{code}</div>
            </div>
            <div className="card stack">
              <h2>Players ({data.players.length})</h2>
              {data.players.length === 0 ? (
                <p className="muted">Waiting for players to scan the QR code…</p>
              ) : (
                <div className="chips">{data.players.map((n) => <span className="chip" key={n}>{n}</span>)}</div>
              )}
              <div style={{ flex: 1 }} />
              <p className="muted">{data.total} questions · {QUESTION_SECONDS}s each · Accounts, Cards, Financing, Business Products</p>
              <button className="btn" disabled={busy || data.players.length === 0} onClick={() => act("start")}>
                Start game
              </button>
            </div>
          </div>
        )}

        {(data.phase === "question" || data.phase === "reveal") && data.question && (
          <div className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="pill">{data.question.category}</span>
              <b>Question {data.qIndex + 1} / {data.total}</b>
            </div>
            <div className="big">{data.question.text}</div>
            {data.phase === "question" && (
              <>
                <div className="timer"><div style={{ width: `${(remaining / QUESTION_SECONDS) * 100}%` }} /></div>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <span className="big">{Math.ceil(remaining)}s</span>
                  <span className="muted">{data.answered} / {data.players.length} answered</span>
                  <button className="btn ghost" disabled={busy} onClick={() => act("reveal")}>Reveal now</button>
                </div>
              </>
            )}
            {data.phase === "reveal" && data.reveal && data.stats && (
              <RevealPanel state={data} onNext={() => act("next")} busy={busy} />
            )}
          </div>
        )}

        {data.phase === "finished" && data.leaderboard && (
          <Final board={data.leaderboard} onNew={onReset} />
        )}

        {data.phase !== "finished" && data.phase !== "lobby" && (
          <div className="row" style={{ justifyContent: "flex-end" }}>
            <button className="btn ghost" disabled={busy} onClick={() => confirm("End the game now?") && act("end")}>End game</button>
          </div>
        )}
      </main>
    </>
  );
}

function RevealPanel({ state, onNext, busy }: { state: HostState; onNext: () => void; busy: boolean }) {
  const { reveal, stats, leaderboard } = state;
  if (!reveal || !stats) return null;
  const totalAns = Math.max(1, stats.trueCount + stats.falseCount);
  const last = state.qIndex + 1 >= state.total;
  return (
    <div className="stack">
      <div className={`result ${reveal.answer ? "good" : "bad"}`}>
        <div className="big">Answer: {reveal.answer ? "TRUE" : "FALSE"}</div>
        <div style={{ marginTop: 8 }}>{reveal.explanation}</div>
      </div>
      <div className="grid2">
        <div className="stack">
          <div className="bar"><b style={{ width: 60 }}>True</b><div className="fill" style={{ width: `${(stats.trueCount / totalAns) * 80}%`, background: "var(--true)" }} /><span>{stats.trueCount}</span></div>
          <div className="bar"><b style={{ width: 60 }}>False</b><div className="fill" style={{ width: `${(stats.falseCount / totalAns) * 80}%`, background: "var(--false)" }} /><span>{stats.falseCount}</span></div>
          <p className="muted">{stats.correctCount} of {state.players.length} got it right.</p>
          {stats.fastest.length > 0 && (
            <div>
              <b>Fastest correct</b>
              <ol style={{ margin: "6px 0 0", paddingLeft: 20 }}>
                {stats.fastest.map((f) => <li key={f.name}>{f.name} — {secs(f.ms)}</li>)}
              </ol>
            </div>
          )}
        </div>
        {leaderboard && <Board rows={leaderboard.slice(0, 5)} title="Top 5" />}
      </div>
      <button className="btn" disabled={busy} onClick={onNext}>{last ? "Show final results" : "Next question"}</button>
    </div>
  );
}

function Board({ rows, title }: { rows: LeaderRow[]; title: string }) {
  return (
    <div>
      <b>{title}</b>
      <table>
        <thead><tr><th>#</th><th>Name</th><th className="num">Score</th><th className="num">Time</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.rank}</td>
              <td>{r.name}{r.tieBrokenByTime && <span className="tag">tie → time</span>}</td>
              <td className="num">{r.score}</td>
              <td className="num">{secs(r.timeMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Final({ board, onNew }: { board: LeaderRow[]; onNew: () => void }) {
  const [first, second, third] = board;
  const tie = first && second && first.score === second.score;
  return (
    <div className="stack">
      <div className="card stack center">
        <h1>🏆 BML Product Champion</h1>
        {first ? <div className="code" style={{ letterSpacing: 0 }}>{first.name}</div> : <p>No players</p>}
        {first && <div className="muted">{first.score} / 15 correct · {secs(first.timeMs)} total answer time</div>}
        {tie && <div className="pill" style={{ alignSelf: "center" }}>Draw on score — decided by fastest total answer time</div>}
      </div>
      <div className="podium">
        <div className="p">{second ? <><div className="big">🥈</div><b>{second.name}</b><div className="muted">{second.score} · {secs(second.timeMs)}</div></> : null}</div>
        <div className="p p1">{first ? <><div className="big">🥇</div><b>{first.name}</b><div className="muted">{first.score} · {secs(first.timeMs)}</div></> : null}</div>
        <div className="p">{third ? <><div className="big">🥉</div><b>{third.name}</b><div className="muted">{third.score} · {secs(third.timeMs)}</div></> : null}</div>
      </div>
      <div className="card"><Board rows={board} title="Full leaderboard" /></div>
      <p className="muted">Ranking: most correct answers. On a draw, the lower total time across correct answers wins.</p>
      <button className="btn" onClick={onNew}>Host a new game</button>
    </div>
  );
}
