"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function JoinForm() {
  const params = useSearchParams();
  const router = useRouter();
  const [code, setCode] = useState(params.get("code") ?? "");
  const [name, setName] = useState("");
  const [staffId, setStaffId] = useState("");
  const [department, setDepartment] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fromQr = Boolean(params.get("code"));

  const join = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const c = code.trim();
      const res = await fetch(`/api/game/${encodeURIComponent(c)}/join`, { method: "POST", body: JSON.stringify({ name, staffId, department }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      try { localStorage.setItem(`bmlpc:${c}`, JSON.stringify({ playerId: j.playerId, token: j.token, name: j.name })); } catch {}
      router.push(`/play/${c}?p=${j.playerId}&t=${j.token}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not join");
      setBusy(false);
    }
  };

  return (
    <form className="stack" onSubmit={join}>
      <h1>Register to play</h1>
      {!fromQr && (
        <input inputMode="numeric" placeholder="Game code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} maxLength={6} />
      )}
      {fromQr && <p className="muted">Game <b>{code}</b></p>}
      <label className="stack" style={{ gap: 6 }}>
        <b>Full name</b>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus autoComplete="name" required />
      </label>
      <label className="stack" style={{ gap: 6 }}>
        <b>Staff ID</b>
        <input value={staffId} onChange={(e) => setStaffId(e.target.value)} maxLength={20} autoComplete="off" required />
      </label>
      <label className="stack" style={{ gap: 6 }}>
        <b>Department / Branch <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></b>
        <input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={60} />
      </label>
      {err && <div className="err">{err}</div>}
      <button className="btn" disabled={busy || !code || !name.trim() || !staffId.trim()}>{busy ? "Registering…" : "Register & join"}</button>
    </form>
  );
}

export default function JoinPage() {
  return (
    <>
      <div className="header"><b>BML Product Champion</b></div>
      <main className="wrap narrow" style={{ paddingTop: 40 }}>
        <Suspense><JoinForm /></Suspense>
      </main>
    </>
  );
}
