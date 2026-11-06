"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Brand } from "@/components/Brand";
import { ACTIVITY, EVENT } from "@/lib/types";

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
      const res = await fetch(`/api/game/${encodeURIComponent(c)}/join`, {
        method: "POST",
        body: JSON.stringify({ name, staffId, department }),
      });
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
    <form className="hero" style={{ paddingTop: "3vh" }} onSubmit={join}>
      <div>
        <div className="eyebrow">{EVENT}</div>
        <h1 style={{ fontSize: "clamp(2rem, 8vw, 3rem)" }}>Register for <span>{ACTIVITY}</span></h1>
      </div>
      {fromQr ? (
        <span className="pill" style={{ alignSelf: "flex-start" }}>Game {code}</span>
      ) : (
        <label className="field">
          <span>Game code</span>
          <input inputMode="numeric" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} maxLength={6} placeholder="6-digit code" required />
        </label>
      )}
      <label className="field">
        <span>Full name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus autoComplete="name" required />
      </label>
      <label className="field">
        <span>Staff ID</span>
        <input value={staffId} onChange={(e) => setStaffId(e.target.value)} maxLength={20} autoComplete="off" required />
      </label>
      <label className="field">
        <span>Department / Branch <small>(optional)</small></span>
        <input value={department} onChange={(e) => setDepartment(e.target.value)} maxLength={60} />
      </label>
      {err && <div className="err">{err}</div>}
      <button className="btn lg" disabled={busy || !code || !name.trim() || !staffId.trim()}>
        {busy ? "Registering…" : "Register & join"}
      </button>
    </form>
  );
}

export default function JoinPage() {
  return (
    <>
      <header className="topbar"><Brand /></header>
      <main className="wrap narrow">
        <Suspense><JoinForm /></Suspense>
      </main>
    </>
  );
}
