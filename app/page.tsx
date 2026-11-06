import Link from "next/link";
import { Brand } from "@/components/Brand";
import { ACTIVITY, EVENT } from "@/lib/types";

export default function Home() {
  return (
    <>
      <header className="topbar"><Brand /></header>
      <main className="wrap narrow">
        <div className="hero">
          <div>
            <div className="eyebrow">{EVENT}</div>
            <h1>Are you the <span>{ACTIVITY}</span>?</h1>
          </div>
          <p className="muted" style={{ fontSize: "1.1rem", margin: 0 }}>
            A live True / False challenge on BML products and services.
          </p>
          <div className="rules card">
            <div className="rule"><i>1</i><span>Scan the QR code on the screen and register.</span></div>
            <div className="rule"><i>2</i><span>Answer each question on your phone — True or False.</span></div>
            <div className="rule"><i>3</i><span>Most correct answers wins. If it&apos;s a tie, the fastest wins.</span></div>
          </div>
          <Link className="btn lg" href="/join">Join a game</Link>
          <Link className="btn ghost" href="/host">Host a game</Link>
        </div>
      </main>
    </>
  );
}
