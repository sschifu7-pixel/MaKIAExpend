import type { GhostEmotion } from "@/lib/machine";
import { cn } from "@/lib/utils";

export function GhostAvatar({ state, size = 160 }: { state: GhostEmotion | "talking"; size?: number }) {
  const anim = state === "surprised" ? "animate-ghost-shake" : "animate-ghost-float";
  const eyes =
    state === "happy" ? (
      <>
        <path d="M38 52 q8 -10 16 0" className="stroke-background" strokeWidth="5" fill="none" strokeLinecap="round" />
        <path d="M66 52 q8 -10 16 0" className="stroke-background" strokeWidth="5" fill="none" strokeLinecap="round" />
      </>
    ) : state === "thinking" ? (
      <>
        <ellipse cx="46" cy="50" rx="6" ry="4" className="fill-background" />
        <ellipse cx="74" cy="50" rx="6" ry="4" className="fill-background" />
      </>
    ) : (
      <>
        <ellipse cx="46" cy="50" rx={state === "surprised" ? 9 : 7} ry={state === "surprised" ? 11 : 9} className="fill-background" />
        <ellipse cx="74" cy="50" rx={state === "surprised" ? 9 : 7} ry={state === "surprised" ? 11 : 9} className="fill-background" />
      </>
    );
  const mouth =
    state === "happy" ? (
      <path d="M48 70 q12 14 24 0" className="fill-background" />
    ) : state === "surprised" ? (
      <ellipse cx="60" cy="74" rx="7" ry="9" className="fill-background" />
    ) : state === "talking" ? (
      <ellipse cx="60" cy="72" rx="8" ry="5" className="fill-background" />
    ) : (
      <path d="M52 72 q8 5 16 0" className="stroke-background" strokeWidth="4" fill="none" strokeLinecap="round" />
    );
  return (
    <svg viewBox="0 0 120 130" width={size} height={size} className={cn(anim, "drop-shadow-[0_0_24px_var(--primary)]")} aria-label={`Fantasma ${state}`}>
      <path
        d="M60 8 C28 8 14 34 14 62 L14 118 L28 106 L42 120 L60 106 L78 120 L92 106 L106 118 L106 62 C106 34 92 8 60 8 Z"
        className="fill-foreground"
      />
      {eyes}
      {mouth}
      {(state === "happy" || state === "thinking") && (
        <>
          <circle cx="34" cy="64" r="5" className="fill-accent" opacity="0.5" />
          <circle cx="86" cy="64" r="5" className="fill-accent" opacity="0.5" />
        </>
      )}
    </svg>
  );
}
