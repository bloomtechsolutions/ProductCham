type P = { className?: string };
const base = { fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export const TrophyIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} stroke="#fff" aria-hidden="true">
    <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
    <path d="M17 6h3a2 2 0 0 1-2 4h-1M7 6H4a2 2 0 0 0 2 4h1" />
  </svg>
);

export const BigTrophy = ({ className }: P) => (
  <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="tg" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0" stopColor="#ffe08a" /><stop offset="1" stopColor="#d9a514" />
      </linearGradient>
    </defs>
    <path d="M18 8h28v14a14 14 0 0 1-28 0V8Z" fill="url(#tg)" />
    <path d="M46 12h8a7 7 0 0 1-7 11h-2M18 12h-8a7 7 0 0 0 7 11h2" fill="none" stroke="#d9a514" strokeWidth="4" />
    <rect x="28" y="36" width="8" height="10" fill="#d9a514" />
    <rect x="20" y="46" width="24" height="8" rx="2" fill="url(#tg)" />
  </svg>
);

export const ExpandIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </svg>
);
export const ShrinkIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
  </svg>
);
export const ScreenIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} aria-hidden="true">
    <rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" />
  </svg>
);
export const CheckIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={3} aria-hidden="true"><path d="M5 12.5 10 17l9-10" /></svg>
);
export const CrossIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} {...base} strokeWidth={3} aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
);
export const BoltIcon = ({ className }: P) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z" /></svg>
);
