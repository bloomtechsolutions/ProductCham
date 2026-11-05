"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCountdown, usePoll } from "@/lib/usePoll";
import { LeaderRow, PublicState, secs } from "@/lib/types";

interface Me {
  name: string;
  answered: boolean;
  answer?: boolean | null;
  correct?: boolean;
  ms?: number | null;
  score?: number;
  rank?: number;
  timeMs?: number;
  of?: number;
}
interface PlayerState extends PublicState { me: Me | null; leaderboard?: LeaderRow[] }

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const [creds, setCreds] = useState<{ playerId: string; token: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Credentials come from the URL (survives private mode) or localStorage.
    const sp = new URLSearchParams(window.location.search);
    const p = sp.get("p"), t = sp.get("t");
    if (p && t) {
      setCreds({ playerId: p, token: t });
      try { localStorage.setItem(`bmlpc:${code}`, JSON.stringify({ playerId: p, token: t })); } catch {}
      window.history.replaceState(null, "", `/play/${code}`);
    } else {
      try {
        const raw = localStorage.getItem(`bmlpc:${code}`);
        if (raw) setCreds(JSON.parse(raw));
      } catch {}
    }
    setLoaded(true);
  }, [code]);

  if (!loaded) return null;
  if (!creds) {
    return (
      <main className="wrap narrow stack" style={{ paddingTop: 48 }}>
        <p>You haven&apos;t joined this game yet.</p>
        <Link className="btn" href={`/join?code=${code}`}>Join game {code}</Link>
      </main>
    );
  }
  return <Player code={code} creds={creds} />;
}

function Player({ code, creds }: { code: string; creds: { playerId: string; token: string } }) {
  const { data, error, offset, refresh } = usePoll<PlayerState>(`/api/game/${code}?player=${creds.playerId}`, 1200);
  const remaining = useCountdown(data?.phase === "question" ? data.endsAt : undefined, offset);
  const [picked, setPicked] = useState<{ q: number; answer: boolean } | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const send = async (answer: boolean) => {
    if (!data) return;
    const q = data.qIndex;
    setPicked({ q, answer });
    setMsg(null);
    const res = await fetch(`/api/game/${code}/answer`, {
      method: "POST",
      body: JSON.stringify({ playerId: creds.playerId, token: creds.token, qIndex: q, answer }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMsg(j.error);
      if (j.error !== "You already answered this question.") setPicked(null);
    } else setMsg(`Locked in at ${secs(j.ms)}`);
    refresh();
  };

  if (!data) return <main className="wrap narrow"><p className="muted">{error ?? "Connecting…"}</p></main>;
  if (!data.me) {
    return (
      <main className="wrap narrow stack" style={{ paddingTop: 48 }}>
        <p>We couldn&apos;t find you in this game.</p>
        <Link className="btn" href={`/join?code=${code}`}>Join again</Link>
      </main>
    );
  }

  const me = data.me;
  const pickedNow = picked && picked.q === data.qIndex ? picked : null;
  const answered = me.answered || Boolean(pickedNow);

  return (
    <>
      <div className="header"><b>{me.name}</b><small>Game {code}{data.qIndex >= 0 && data.phase !== "finished" ? ` · Q${data.qIndex + 1}/${data.total}` : ""}</small></div>
      <main className="wrap narrow stack">
        {error && <div className="err">{error}</div>}

        {data.phase === "lobby" && (
          <div className="card stack center">
            <h2>You&apos;re in! 🎉</h2>
            <p className="muted">Look at the main screen. The quiz will start soon.</p>
            <p className="muted">Tip: most correct answers wins. On a draw, the fastest wins — so be quick!</p>
          </div>
        )}

        {data.phase === "question" && data.question && (
          <div className="stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <span className="pill">{data.question.category}</span>
              <b>{Math.ceil(remaining)}s</b>
            </div>
            <div className="timer"><div style={{ width: `${(remaining / 20) * 100}%` }} /></div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{data.question.text}</div>
            {!answered && remaining > 0 ? (
              <div className="tf">
                <button className="t" onClick={() => send(true)}>TRUE</button>
                <button className="f" onClick={() => send(false)}>FALSE</button>
              </div>
            ) : (
              <div className="result none">
                <div className="big">{answered ? `You said ${pickedNow ? (pickedNow.answer ? "TRUE" : "FALSE") : "…"}` : "Time's up"}</div>
                <div>{msg ?? "Waiting for the answer…"}</div>
              </div>
            )}
            {msg && !answered && <div className="err">{msg}</div>}
          </div>
        )}

        {data.phase === "reveal" && data.reveal && (
          <div className="stack">
            <div className={`result ${me.answer === null || me.answer === undefined ? "none" : me.correct ? "good" : "bad"}`}>
              <div className="big">
                {me.answer === null || me.answer === undefined ? "No answer" : me.correct ? "Correct! ✅" : "Not quite ❌"}
              </div>
              <div style={{ marginTop: 6 }}>Answer: <b>{data.reveal.answer ? "TRUE" : "FALSE"}</b>{me.ms != null && ` · you took ${secs(me.ms)}`}</div>
            </div>
            <p className="muted">{data.reveal.explanation}</p>
            <div className="card center"><b>Your score: {me.score ?? 0} / {data.qIndex + 1}</b></div>
          </div>
        )}

        {data.phase === "finished" && (
          <div className="stack">
            <div className="card stack center">
              <div className="big">{me.rank === 1 ? "🏆 You're the Product Champion!" : "Game over"}</div>
              {me.rank && <div className="code" style={{ letterSpacing: 0 }}>#{me.rank}<span className="muted" style={{ fontSize: "1rem" }}> of {me.of}</span></div>}
              <div>{me.score} / {data.total} correct · {secs(me.timeMs ?? 0)} total time</div>
            </div>
            {data.leaderboard && (
              <div className="card stack">
                <b>Top 3</b>
                {data.leaderboard.map((r) => (
                  <div key={r.id} className="row" style={{ justifyContent: "space-between" }}>
                    <span>{["🥇", "🥈", "🥉"][r.rank - 1]} {r.name}</span>
                    <span className="muted">{r.score} · {secs(r.timeMs)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
