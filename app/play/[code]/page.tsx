"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { BigTrophy, CheckIcon, CrossIcon } from "@/components/Icons";
import { useCountdown, usePoll } from "@/lib/usePoll";
import { LeaderRow, PublicState, catClass, secs } from "@/lib/types";

interface Me {
  name: string; answered: boolean;
  answer?: boolean | null; correct?: boolean; ms?: number | null; score?: number;
  rank?: number; timeMs?: number; of?: number;
}
interface PlayerState extends PublicState { me: Me | null; leaderboard?: LeaderRow[] }

export default function PlayPage() {
  const { code } = useParams<{ code: string }>();
  const [creds, setCreds] = useState<{ playerId: string; token: string } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
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
      <>
        <header className="topbar"><Brand /></header>
        <main className="phone">
          <p>You haven&apos;t registered for this game yet.</p>
          <Link className="btn lg" href={`/join?code=${code}`}>Register for game {code}</Link>
        </main>
      </>
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

  const header = (
    <header className="topbar">
      <Brand />
      {data?.me && <span className="pill">{data.me.name}</span>}
    </header>
  );

  if (!data) return <>{header}<main className="phone"><p className="muted">{error ?? "Connecting…"}</p></main></>;
  if (!data.me) {
    return (
      <>{header}
        <main className="phone">
          <p>We couldn&apos;t find your registration in this game.</p>
          <Link className="btn lg" href={`/join?code=${code}`}>Register again</Link>
        </main>
      </>
    );
  }

  const me = data.me;
  const pickedNow = picked && picked.q === data.qIndex ? picked : null;
  const answered = me.answered || Boolean(pickedNow);
  const qSecs = data.questionSeconds || 20;

  return (
    <>
      {header}
      <main className="phone">
        {error && <div className="err">{error}</div>}

        {data.phase === "lobby" && (
          <div className="stack center" style={{ marginTop: "8vh", alignItems: "center" }}>
            <div className="result none" style={{ width: "100%" }}>
              <CheckIcon className="v-ic" />
              <div className="big" style={{ marginTop: 8 }}>You&apos;re registered!</div>
              <p className="muted" style={{ margin: "8px 0 0" }}>Watch the main screen — the host will start soon.</p>
            </div>
            <div className="card" style={{ width: "100%", textAlign: "left" }}>
              <b>How to win</b>
              <p className="muted" style={{ margin: "6px 0 0" }}>
                {data.total} True/False questions, {qSecs}s each. Most correct answers wins — on a tie, the fastest total answer time wins.
              </p>
            </div>
          </div>
        )}

        {data.phase === "question" && data.question && (
          <>
            <div className="row between">
              <span className={`pill ${catClass(data.question.category)}`}><span className="dot" /><span style={{ color: "var(--ink)" }}>{data.question.category}</span></span>
              <span className="pill">Q{data.qIndex + 1}/{data.total} · {Math.ceil(remaining)}s</span>
            </div>
            <div className="timer-bar"><div style={{ width: `${(remaining / qSecs) * 100}%` }} /></div>
            <div className="p-question">{data.question.text}</div>
            {!answered && remaining > 0 ? (
              <div className="tf">
                <button className="t" onClick={() => send(true)}><CheckIcon />TRUE</button>
                <button className="f" onClick={() => send(false)}><CrossIcon />FALSE</button>
              </div>
            ) : (
              <div className="result none">
                <div className="big">{answered ? `You said ${pickedNow ? (pickedNow.answer ? "TRUE" : "FALSE") : "…"}` : "Time's up"}</div>
                <div className="muted" style={{ marginTop: 6 }}>{msg ?? "Waiting for the answer…"}</div>
              </div>
            )}
            {msg && !answered && <div className="err">{msg}</div>}
          </>
        )}

        {data.phase === "reveal" && data.reveal && (
          <>
            <div className={`result ${me.answer == null ? "none" : me.correct ? "good" : "bad"}`}>
              {me.answer != null && (me.correct ? <CheckIcon className="v-ic" /> : <CrossIcon className="v-ic" />)}
              <div className="big">{me.answer == null ? "No answer" : me.correct ? "Correct!" : "Not quite"}</div>
              <div style={{ marginTop: 6 }}>The answer is <b>{data.reveal.answer ? "TRUE" : "FALSE"}</b></div>
            </div>
            <p className="muted" style={{ margin: 0 }}>{data.reveal.explanation}</p>
            <div className="score-strip">
              <div className="card"><span className="muted">Score</span><b>{me.score ?? 0}<span className="muted" style={{ fontSize: "1rem" }}> / {data.qIndex + 1}</span></b></div>
              <div className="card"><span className="muted">Your time</span><b>{me.ms != null ? secs(me.ms) : "—"}</b></div>
            </div>
          </>
        )}

        {data.phase === "finished" && (
          <>
            <div className="card stack center" style={{ alignItems: "center" }}>
              {me.rank === 1 && <BigTrophy className="trophy" />}
              <div className="eyebrow">{me.rank === 1 ? "You are the Product Champion!" : "Final result"}</div>
              {me.rank && <div className="winner-name" style={{ fontSize: "4rem" }}>#{me.rank}</div>}
              <div className="muted">of {me.of} players</div>
              <div className="score-strip" style={{ width: "100%" }}>
                <div className="card"><span className="muted">Score</span><b>{me.score} / {data.total}</b></div>
                <div className="card"><span className="muted">Total time</span><b>{secs(me.timeMs ?? 0)}</b></div>
              </div>
            </div>
            {data.leaderboard && (
              <div className="card stack">
                <b>Top 3</b>
                {data.leaderboard.map((r) => (
                  <div key={r.id} className="row between">
                    <span className="row" style={{ gap: 10 }}><span className={`rank-badge r${r.rank}`}>{r.rank}</span>{r.name}</span>
                    <span className="muted">{r.score} · {secs(r.timeMs)}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </>
  );
}
