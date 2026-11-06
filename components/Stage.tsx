"use client";
import { QRCodeSVG } from "qrcode.react";
import { ACTIVITY, EVENT, HostState, LeaderRow, catClass, secs } from "@/lib/types";
import { BigTrophy, BoltIcon, CheckIcon, CrossIcon } from "./Icons";

/** Big-screen presentation of the game. Used by /screen (projector) and /host. */
export function Stage({ data, joinUrl, remaining, docked = false }: {
  data: HostState; joinUrl: string; remaining: number; docked?: boolean;
}) {
  return (
    <section className={`stage${docked ? " docked" : ""}`}>
      {data.phase === "lobby" && <Lobby data={data} joinUrl={joinUrl} />}
      {data.phase === "question" && <QuestionView data={data} remaining={remaining} />}
      {data.phase === "reveal" && <RevealView data={data} />}
      {data.phase === "finished" && <FinalView board={data.leaderboard ?? []} total={data.total} />}
    </section>
  );
}

function Lobby({ data, joinUrl }: { data: HostState; joinUrl: string }) {
  const shortUrl = joinUrl.replace(/^https?:\/\//, "").replace(/\?.*$/, "");
  return (
    <>
      <div className="stage-hero">
        <div className="eyebrow">{EVENT}</div>
        <h1>{ACTIVITY}</h1>
      </div>
      <div className="lobby">
        <div className="card qr-card">
          <div className="code-label">Scan to join</div>
          <div className="qr-box">{joinUrl && <QRCodeSVG value={joinUrl} size={512} marginSize={1} level="M" />}</div>
          <div className="muted join-url">or visit <b style={{ color: "var(--ink)" }}>{shortUrl}</b></div>
          <div className="code-label">Game code</div>
          <div className="code">{data.code}</div>
        </div>
        <div className="card players-card">
          <div className="row between" style={{ alignItems: "flex-end" }}>
            <div>
              <div className="code-label">Players registered</div>
              <div className="big-count">{data.players.length}</div>
            </div>
            <div className="waiting"><span className="pulse" />Waiting for host to start</div>
          </div>
          {data.players.length === 0 ? (
            <p className="muted" style={{ fontSize: "1.2rem" }}>Scan the QR code with your phone camera to register.</p>
          ) : (
            <div className="chips">{data.players.map((n) => <span className="chip" key={n}>{n}</span>)}</div>
          )}
          <div className="grow" />
          <div className="stack" style={{ gap: 10 }}>
            <div className="muted" style={{ fontWeight: 600 }}>
              {data.total} True / False questions · {data.questionSeconds}s each · Most correct wins — ties go to the fastest
            </div>
            <div className="cats">
              {["Accounts", "Cards", "Financing", "Business Products"].map((c) => (
                <div key={c} className={`cat-tile ${catClass(c)}`}><span className="dot" /><span style={{ color: "var(--ink)" }}>{c}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Progress({ data }: { data: HostState }) {
  return (
    <div className="q-progress" aria-label={`Question ${data.qIndex + 1} of ${data.total}`}>
      {Array.from({ length: data.total }, (_, i) => (
        <span key={i} className={i < data.qIndex ? "done" : i === data.qIndex ? "now" : ""} />
      ))}
    </div>
  );
}

function QHead({ data }: { data: HostState }) {
  return (
    <div className="q-head">
      <span className={`pill ${catClass(data.question?.category)}`}>
        <span className="dot" /><span style={{ color: "var(--ink)" }}>{data.question?.category}</span>
      </span>
      <Progress data={data} />
      <span className="q-num">Q{data.qIndex + 1} / {data.total}</span>
    </div>
  );
}

function Ring({ remaining, total }: { remaining: number; total: number }) {
  const r = 52, c = 2 * Math.PI * r;
  const frac = Math.max(0, Math.min(1, remaining / total));
  return (
    <div className={`ring${remaining <= 5 ? " low" : ""}`} role="timer" aria-label={`${Math.ceil(remaining)} seconds left`}>
      <svg viewBox="0 0 120 120">
        <circle className="track" cx="60" cy="60" r={r} />
        <circle className="bar" cx="60" cy="60" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - frac)} />
      </svg>
      <div className="num">{Math.ceil(remaining)}</div>
    </div>
  );
}

function QuestionView({ data, remaining }: { data: HostState; remaining: number }) {
  return (
    <>
      <QHead data={data} />
      <div className="q-text">{data.question?.text}</div>
      <div className="q-foot">
        <Ring remaining={remaining} total={data.questionSeconds} />
        <div className="answered">
          <b>{data.answered}<span style={{ fontSize: "0.5em", color: "var(--muted)" }}> / {data.players.length}</span></b>
          <span>answered</span>
        </div>
        <div className="tf-hint"><div className="t">TRUE</div><div className="f">FALSE</div></div>
      </div>
    </>
  );
}

function RevealView({ data }: { data: HostState }) {
  const { reveal, stats, leaderboard } = data;
  if (!reveal) return null;
  const t = stats?.trueCount ?? 0, f = stats?.falseCount ?? 0, n = Math.max(1, t + f);
  return (
    <>
      <QHead data={data} />
      <div className="q-text" style={{ fontSize: "clamp(1.4rem, 2.8vw, 2.8rem)", flex: "none" }}>{data.question?.text}</div>
      <div className={`verdict ${reveal.answer ? "t" : "f"}`}>
        {reveal.answer ? <CheckIcon className="v-ic" /> : <CrossIcon className="v-ic" />}
        <div>
          <div className="word">{reveal.answer ? "TRUE" : "FALSE"}</div>
          <div className="why">{reveal.explanation}</div>
        </div>
      </div>
      <div className="reveal">
        <div className="card stack">
          <div className="row between">
            <h3>How the room answered</h3>
            <span className="muted" style={{ fontWeight: 700 }}>{stats?.correctCount ?? 0} of {data.players.length} correct</span>
          </div>
          <div className="split">
            <div className="split-row"><span>TRUE</span><div className="split-track"><div className="split-fill t" style={{ width: `${(t / n) * 100}%` }} /></div><span className="num">{t}</span></div>
            <div className="split-row"><span>FALSE</span><div className="split-track"><div className="split-fill f" style={{ width: `${(f / n) * 100}%` }} /></div><span className="num">{f}</span></div>
          </div>
          {stats && stats.fastest.length > 0 && (
            <>
              <h3 style={{ marginTop: 6 }}>Fastest correct</h3>
              <div className="fast-list">
                {stats.fastest.map((x, i) => (
                  <div className="fast-item" key={x.name}>
                    <BoltIcon className="bolt" />
                    <span>{i + 1}. {x.name}</span>
                    <span className="t">{secs(x.ms)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        {leaderboard && (
          <div className="card stack">
            <h3>Leaderboard</h3>
            <Board rows={leaderboard.slice(0, 5)} />
          </div>
        )}
      </div>
    </>
  );
}

export function Board({ rows, full = false }: { rows: LeaderRow[]; full?: boolean }) {
  // "Tie" tags only matter once the game is over (full results / final view).
  return (
    <table className="board">
      <thead>
        <tr>
          <th>#</th><th>Name</th>
          {full && <th>Department</th>}
          <th className="num">Score</th><th className="num">Time</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td><span className={`rank-badge${r.rank <= 3 ? ` r${r.rank}` : ""}`}>{r.rank}</span></td>
            <td>
              {r.name}
              {full && r.tieBrokenByTime && <span className="tag">TIE · TIME</span>}
              {full && r.staffId && <div className="sub">{r.staffId}</div>}
            </td>
            {full && <td className="muted">{r.department ?? "—"}</td>}
            <td className="num"><b>{r.score}</b></td>
            <td className="num muted">{secs(r.timeMs)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FinalView({ board, total }: { board: LeaderRow[]; total: number }) {
  const [first, second, third] = board;
  const tie = first && second && first.score === second.score;
  return (
    <>
      <div className="winner">
        <div className="eyebrow">{EVENT} · {ACTIVITY}</div>
        <BigTrophy className="trophy" />
        {first ? (
          <>
            <div className="winner-name">{first.name}</div>
            <div className="muted" style={{ fontSize: "clamp(1rem, 1.6vw, 1.4rem)", fontWeight: 600 }}>
              {first.department ? `${first.department} · ` : ""}{first.score} / {total} correct · {secs(first.timeMs)}
            </div>
            {tie && <div className="tie-note"><BoltIcon className="bolt" />Tied on score — won on fastest total answer time</div>}
          </>
        ) : (
          <div className="winner-name">No players</div>
        )}
      </div>
      <div className="podium">
        {[{ p: second, c: "p2", n: 2 }, { p: first, c: "p1", n: 1 }, { p: third, c: "p3", n: 3 }].map(({ p, c, n }) => (
          <div className={`step ${c}`} key={c}>
            {p && <><div className="who">{p.name}</div><div className="stat">{p.score} pts · {secs(p.timeMs)}</div></>}
            <div className="block" style={{ visibility: p ? "visible" : "hidden" }}>{n}</div>
          </div>
        ))}
      </div>
      {board.length > 3 && (
        <div className="rest">
          {board.slice(3, 12).map((r) => (
            <span className="chip" key={r.id}>
              <span className="rank-badge">{r.rank}</span>{r.name}<span className="muted">{r.score} · {secs(r.timeMs)}</span>
            </span>
          ))}
        </div>
      )}
    </>
  );
}
