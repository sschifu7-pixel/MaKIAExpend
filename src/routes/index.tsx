import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Particles } from "@/components/Particles";
import { VendingControl } from "@/components/VendingControl";
import { ChatPanel } from "@/components/ChatPanel";
import { TestPanel } from "@/components/TestPanel";
import { machine } from "@/lib/machine";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IAFantasma — Expendedora Web3 con voz" },
      { name: "description", content: "Panel de control de la máquina expendedora IAFantasma: pagos NFC, voz con ElevenLabs, flujos n8n y telemetría ESP32/Pico." },
      { property: "og:title", content: "IAFantasma — Expendedora Web3 con voz" },
      { property: "og:description", content: "Controla la expendedora espectral: NFC, voz, n8n y hardware en vivo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const tabs = [
  ["vending", "🎮 Máquina"],
  ["chat", "💬 Chat Espectral"],
  ["tests", "🧪 Pruebas"],
] as const;
type Tab = (typeof tabs)[number][0];

function Index() {
  const [tab, setTab] = useState<Tab>("vending");
  useEffect(() => machine.hydrate(), []);
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Particles />
      <div className="bg-grid pointer-events-none fixed inset-0 z-0" />
      <nav className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b bg-background/80 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="text-3xl drop-shadow-[0_0_8px_var(--primary)]">👻</span>
          <div className="leading-tight">
            <div className="text-brand text-lg font-extrabold tracking-widest">IAFANTASMA</div>
            <div className="text-[10px] font-bold tracking-wider text-accent">EXPENDEDORA WEB3 & ELEVENLABS</div>
          </div>
        </div>
        <div className="flex gap-1 rounded-xl border bg-muted p-1">
          {tabs.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn("rounded-lg px-4 py-1.5 text-sm font-semibold transition", tab === k ? "bg-secondary text-primary glow-primary" : "text-muted-foreground hover:text-foreground")}
            >
              {l}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
          <span className="h-2 w-2 rounded-full bg-success" /> RP2040 / ESP32 & n8n
        </span>
      </nav>
      <main className="relative z-10">
        {tab === "vending" && <VendingControl />}
        {tab === "chat" && <ChatPanel />}
        {tab === "tests" && <TestPanel />}
      </main>
    </div>
  );
}
