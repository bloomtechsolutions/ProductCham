import { ACTIVITY, EVENT } from "@/lib/types";
import { TrophyIcon } from "./Icons";

export function Brand() {
  return (
    <div className="brand">
      <div className="brand-mark"><TrophyIcon /></div>
      <div className="brand-text">
        <span className="eyebrow">{EVENT}</span>
        <span className="brand-title">{ACTIVITY}</span>
      </div>
    </div>
  );
}
