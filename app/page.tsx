import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="header"><b>BML Product Champion</b><small>Accounts · Cards · Financing · Business</small></div>
      <main className="wrap narrow stack" style={{ paddingTop: 48 }}>
        <h1>Who is the BML Product Champion?</h1>
        <p className="muted">15 True/False questions on BML products and services. Most correct answers wins — if it&apos;s a draw, the fastest wins.</p>
        <Link className="btn" href="/join">Join a game</Link>
        <Link className="btn ghost" href="/host">Host a game</Link>
      </main>
    </>
  );
}
