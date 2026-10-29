import type { ReactNode } from "react";

export const btn =
  "rounded-lg border px-3 py-1.5 text-xs font-semibold transition hover:bg-secondary disabled:pointer-events-none disabled:opacity-40";
export const btnPrimary =
  "rounded-lg bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-40";
export const btnAccent =
  "rounded-lg bg-accent px-3 py-2 text-xs font-bold text-accent-foreground transition hover:opacity-90 disabled:opacity-40";
export const input = "rounded-md border bg-input px-2 py-1 text-xs outline-none focus:ring-2 focus:ring-ring";

export function Card({ title, tag, children }: { title: string; tag?: string; children: ReactNode }) {
  return (
    <section className="panel flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold">{title}</h2>
        {tag && <span className="rounded-full border px-2 py-0.5 font-mono text-[10px] text-muted-foreground">{tag}</span>}
      </div>
      {children}
    </section>
  );
}

export function Box({ title, pins, children, active }: { title: string; pins?: string; children: ReactNode; active?: boolean }) {
  return (
    <div className={`rounded-xl border p-3 ${active ? "border-primary" : ""}`}>
      <h3 className="text-sm font-bold">{title}</h3>
      {pins && <p className="mb-3 font-mono text-[10px] text-muted-foreground">{pins}</p>}
      {children}
    </div>
  );
}
